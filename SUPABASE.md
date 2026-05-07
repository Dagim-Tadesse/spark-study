# Supabase Integration Guide

This app now has **local-first persistence** with **cloud sync** support. Here's how to set it up and what works.

---

## Quick Start

### 1. Set up `.env.local`

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from your Supabase project dashboard:

- **URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → anon (public) key

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up/log in.
2. Create a new project (choose a region).
3. Wait for provisioning to complete (~2 minutes).
4. Copy the URL and Anon Key (step 1 above).

### 3. Apply the database schema

1. In Supabase dashboard, go to **SQL Editor**.
2. Click **New Query**.
3. Copy the entire contents of `supabase/schema.sql`.
4. Paste into the SQL editor.
5. Click **Run** (⌘+Enter or Ctrl+Enter).

This creates:

- `auth.users` (Supabase manages this automatically)
- `profiles`, `decks`, `cards`, `card_history`, `study_events` tables
- Row Level Security (RLS) policies for user isolation
- Stored procedures (e.g., auto-create profile on signup)

### 4. Enable email auth

1. In Supabase dashboard, go to **Authentication** → **Providers**.
2. Ensure **Email** is enabled (it is by default).
3. (Optional) Configure email templates and SMTP if you want custom emails.

### 5. Start the dev server

```bash
npm run dev
```

Then:

1. Click **Sign up** on [http://localhost:5173/login](http://localhost:5173/login).
2. Enter your email and password (Supabase will send a verification email by default).
3. After confirming, you'll be logged in and redirected to `/app`.

---

## Current Architecture

### Data Flow

```
┌──────────────────┐
│  React UI Pages  │
│   (Index.tsx)    │
└────────┬─────────┘
         │ (calls)
         ▼
┌──────────────────────┐
│  useStudyData Hook   │  ◄─── Local source of truth
│  (localStorage)      │       (always works offline)
└────────┬─────────────┘
         │ (syncs async every 5s)
         ▼
┌──────────────────────┐
│ Supabase Services    │  ◄─── If user is logged in
│ (deckService, etc.)  │       (optional cloud sync)
└──────────────────────┘
         │ (calls)
         ▼
┌──────────────────────┐
│  Supabase Backend    │  ◄─── PostgreSQL + RLS
│  (cloud hosted)      │
└──────────────────────┘
```

### How Sync Works

1. **Local-first**: All writes go to `localStorage` immediately (via `useStudyData`).
2. **Async push**: Every 5 seconds, if user is authenticated, changes are pushed to Supabase.
3. **Fallback**: If Supabase credentials are missing or network is down, the app still works (uses localStorage).
4. **Conflict resolution**: Supabase timestamps override local data (last-write-wins).

---

## Known Limitations & Next Steps

### ✅ What works now

- **Sign up / sign in**: Creates a Supabase auth session.
- **Local CRUD**: Add/edit/delete decks and cards offline.
- **Persistence**: Data survives page refresh (localStorage).
- **Profile creation**: Auto-created on signup via database trigger.

### ❌ Not yet implemented

- **Real-time multi-device sync**: If you edit on your phone and then use the desktop, each device has its own local copy. No automatic merge.
- **Server-side scheduling**: `study_events` table exists but UI doesn't yet push results to it. Scheduling `next_review` is computed locally.
- **Server-side trash cleanup**: Trash items marked `deleted_at` are stored, but a 30-day purge job doesn't run server-side yet.
- **Version history storage**: `card_history` table is not yet populated from UI edits.

### 🔧 To fully integrate

1. **Wire UI to services**:
   - When user creates/updates a deck → call `deckService.createDeck(userId, name, color)`.
   - When user creates/updates a card → call `cardService.createCard(userId, cardData)`.
   - Replace local IDs with server IDs (UUID from response).

2. **Real-time updates** (optional, advanced):
   - Use Supabase Realtime subscriptions to listen for changes from other devices.
   - Example: `supabase.from('decks').on('*', (payload) => { /* update local state */ })`.

3. **Study events**:
   - When user marks a card Know/Again, POST to `study_events` table.
   - Update `profiles.streak`, `total_reviews`, `successful_reviews` based on events.

4. **Cron jobs** (optional):
   - Purge soft-deleted cards older than 30 days.
   - Compute and update `profiles.last_study_date`.

---

## Troubleshooting

### "Invalid Supabase URL" or "anon key is missing"

- Check `.env.local` exists and has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Restart dev server after editing `.env.local`.

### "Email verification required"

- Supabase sends a confirmation email by default. Check your inbox (including spam).
- Or disable email confirmation (Supabase → Authentication → Providers → Email → Disable Confirm Email).

### "RLS policy violation" or "violates row level security policy"

- Ensure you are signed in (authenticated user).
- Check that your `user.id` matches the `user_id` in the database record.
- Review RLS policies in `supabase/schema.sql` (lines starting with `create policy`).

### Data not syncing to Supabase

- Check browser console for errors (F12 → Console tab).
- Verify Supabase credentials in `.env.local`.
- Confirm the database schema is applied (check Tables in Supabase GUI).

---

## Local dev with `supabase` CLI (optional)

If you want to run Supabase locally (faster feedback loop):

```bash
npm install -D supabase
npx supabase start
```

This will start a local PostgreSQL + auth server. Use `http://localhost:54321` for `VITE_SUPABASE_URL` in `.env.local`.

See [Supabase Local Dev Docs](https://supabase.com/docs/guides/cli/local-development) for more.

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
