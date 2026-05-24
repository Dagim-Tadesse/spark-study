const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
// Load .env.local first (if present), then fallback to .env
dotenv.config({ path: '.env.local' });
dotenv.config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Support multiple env var names for anon/publishable keys
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file.');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.warn('Using public Supabase key. Inserts may be blocked by RLS. If import fails, add SUPABASE_SERVICE_ROLE_KEY to .env.local and rerun.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function parseCSV(content) {
  // Very small CSV parser: supports quoted fields with commas
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((l) => parseCSVLine(l));
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h.trim()] = row[i] || ''));
    return obj;
  });
}

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.log('Usage: node scripts/import-decks.cjs <file.json|file.csv> --user-id=<user_id> [--color=bg-primary]');
    process.exit(1);
  }

  const file = argv[0];
  const userIdArg = argv.find((a) => a.startsWith('--user-id='));
  const colorArg = argv.find((a) => a.startsWith('--color='));
  const userId = userIdArg ? userIdArg.split('=')[1] : process.env.IMPORT_TARGET_USER_ID;
  const color = colorArg ? colorArg.split('=')[1] : (process.env.IMPORT_DEFAULT_COLOR || 'bg-primary');

  if (!userId) {
    console.error('No --user-id provided and IMPORT_TARGET_USER_ID not set. Provide the target Supabase user id to assign decks to.');
    process.exit(1);
  }

  const ext = path.extname(file).toLowerCase();
  const content = fs.readFileSync(file, 'utf8');
  let decks = [];

  if (ext === '.json') {
    const parsed = JSON.parse(content);
    if (!parsed.decks) {
      console.error('JSON import file must be in format: { "decks": [ { name, tags?, cards: [{front,back}] } ] }');
      process.exit(1);
    }
    decks = parsed.decks.map((d) => ({ name: d.name, tags: d.tags || [], cards: d.cards || [] }));
  } else if (ext === '.csv') {
    const rows = parseCSV(content);
    // Expected headers: deck_name, deck_tags, question, answer
    const grouped = {};
    rows.forEach((r) => {
      const deckName = r.deck_name || r.deck || 'Untitled Deck';
      const tags = (r.deck_tags || r.tags || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      grouped[deckName] = grouped[deckName] || { name: deckName, tags, cards: [] };
      grouped[deckName].cards.push({ front: r.question || r.front || '', back: r.answer || r.back || '' });
    });
    decks = Object.values(grouped);
  } else {
    console.error('Unsupported file extension. Use .json or .csv');
    process.exit(1);
  }

  console.log(`Preparing to import ${decks.length} decks for user ${userId}...`);

  for (const deck of decks) {
    try {
      // create deck
      const { data: deckData, error: deckErr } = await supabase
        .from('spark_study_decks')
        .insert([{ user_id: userId, name: deck.name, color }])
        .select()
        .single();
      if (deckErr) throw deckErr;
      const deckId = deckData.id;
      console.log(`Created deck '${deck.name}' id=${deckId} (${deck.cards.length} cards)`);

      // prepare cards
      const cardPayloads = deck.cards.map((c) => ({
        deck_id: deckId,
        user_id: userId,
        template: c.template || 'Q&A',
        front: c.front || '',
        back: c.back || '',
        tags: c.tags || [],
        next_review: new Date().toISOString(),
        interval: 0,
        ease: 2.5,
      }));

      if (cardPayloads.length > 0) {
        // insert in batches of 50
        for (let i = 0; i < cardPayloads.length; i += 50) {
          const batch = cardPayloads.slice(i, i + 50);
          const { error: cardErr } = await supabase.from('spark_study_cards').insert(batch);
          if (cardErr) throw cardErr;
        }
        console.log(`  Inserted ${cardPayloads.length} cards for deck '${deck.name}'`);
      }
    } catch (err) {
      console.error('Failed to import deck', deck.name, err);
    }
  }

  console.log('Import complete.');
}

main();
