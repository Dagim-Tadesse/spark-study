import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Image,
  Italic,
  Keyboard,
  Layers3,
  List,
  LogOut,
  Moon,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sigma,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Type,
  Undo2,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useStudyData } from "@/hooks/use-study-data";
import { useAuth } from "@/context/AuthContext";

const templates = ["Definition", "Formula", "Q&A", "Diagram"];

const editorTools = [
  { icon: Type, action: "type", label: "Key term" },
  { icon: Italic, action: "italic", label: "Emphasis" },
  { icon: List, action: "list", label: "List" },
  { icon: Sigma, action: "equation", label: "Equation" },
  { icon: Image, action: "image", label: "Image cue" },
  { icon: Volume2, action: "audio", label: "Audio cue" },
  { icon: Undo2, action: "undo", label: "Undo" },
];

const learningPath = [
  { label: "Capture", icon: Layers3 },
  { label: "Encode", icon: Brain },
  { label: "Recall", icon: Target },
  { label: "Master", icon: Award },
];

const hciGoals = [
  { icon: ShieldCheck, title: "Safety", text: "Auto-save, undo and recovery bin keep work intact." },
  { icon: Layers3, title: "Utility", text: "Equations, tags, templates, decks for real coursework." },
  { icon: Zap, title: "Efficiency", text: "Shortcuts, inline editing, one-click create." },
  { icon: BookOpen, title: "Usability", text: "Tabs, ARIA labels, keyboard nav, clear copy." },
  { icon: Target, title: "Effectiveness", text: "Flip + spaced review backed by streak tracking." },
  { icon: Heart, title: "Appeal", text: "Soft motion, gradients, calm typography." },
];

type TabKey = "dashboard" | "editor" | "study" | "safety" | "about";

const tabs: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "editor", label: "Editor", icon: Sparkles },
  { key: "study", label: "Study", icon: Brain },
  { key: "safety", label: "Safety", icon: ShieldCheck },
  { key: "about", label: "About", icon: Heart },
];

const Index = () => {
  const {
    decks,
    cards,
    trash,
    deckCardCounts,
    addDeck: addDeckData,
    addCard: addCardData,
    updateCard: updatePersistedCard,
    deleteCard,
    restoreCardFromTrash,
    restoreCardVersion,
    restoreLatestVersion,
  } = useStudyData();

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("spark-study-theme") === "dark",
  );
  const [flipped, setFlipped] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionCount, setSessionCount] = useState(12);
  const [streak, setStreak] = useState(9);
  const [retention, setRetention] = useState(86);
  const [dueToday, setDueToday] = useState(18);
  const [autosaveText, setAutosaveText] = useState("Auto-saved just now");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("spark-study-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (tab === "study") {
        if (key === "f") {
          e.preventDefault();
          setFlipped((v) => !v);
        } else if (key === "k" || key === "n") {
          e.preventDefault();
          markStudy(true);
        } else if (key === "r") {
          e.preventDefault();
          markStudy(false);
        }
      } else if (tab === "editor") {
        if (key === "c" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          addCard();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tab, flipped]);

  useEffect(() => {
    if (!decks.length) return setSelectedDeckId("");
    if (!selectedDeckId || !decks.some((d) => d.id === selectedDeckId)) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  useEffect(() => {
    if (!selectedDeckId) return setSelectedCardId("");
    const deckCards = cards.filter((c) => c.deckId === selectedDeckId);
    if (!deckCards.length) return setSelectedCardId("");
    if (!selectedCardId || !deckCards.some((c) => c.id === selectedCardId)) {
      setSelectedCardId(deckCards[0].id);
    }
  }, [cards, selectedDeckId, selectedCardId]);

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? cards[0];
  const selectedTemplate = selectedCard?.template ?? "Formula";
  const selectedTags = selectedCard?.tags ?? [];
  const activeDeck = decks.find((d) => d.id === selectedDeckId) ?? decks[0];
  const deckCards = useMemo(
    () => cards.filter((c) => c.deckId === selectedDeckId),
    [cards, selectedDeckId],
  );
  const filteredDecks = useMemo(
    () => decks.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [decks, searchTerm],
  );
  const masteryOffset = 158 - (158 * (activeDeck?.progress ?? 0)) / 100;
  const cardHistory = selectedCard?.history.slice().reverse() ?? [];

  const stats = [
    { label: "Retention", value: `${retention}%`, icon: Brain },
    { label: "Streak", value: `${streak}d`, icon: Sparkles },
    { label: "Due today", value: `${dueToday}`, icon: Clock3 },
    { label: "Decks", value: `${decks.length}`, icon: Layers3 },
  ];

  const updateCard = (updates: Partial<{ front: string; back: string; tags: string[]; template: string }>) => {
    if (!selectedCard) return;
    updatePersistedCard(selectedCard.id, updates);
    setAutosaveText("Editing saved locally");
  };

  const addCard = () => {
    if (!selectedDeckId) return;
    const id = addCardData(selectedDeckId, selectedTemplate);
    setSelectedCardId(id);
    setFlipped(false);
    setAutosaveText("New card created");
    setTab("editor");
  };

  const addDeck = () => {
    const id = addDeckData();
    setSelectedDeckId(id);
    setSelectedCardId("");
    setAutosaveText("New deck created");
  };

  const selectDeck = (id: string) => {
    setSelectedDeckId(id);
    const first = cards.find((c) => c.deckId === id);
    if (first) setSelectedCardId(first.id);
    setFlipped(false);
  };

  const confirmDelete = () => {
    if (!selectedCard) return;
    deleteCard(selectedCard.id);
    setSelectedCardId("");
    setShowSafety(false);
    setAutosaveText("Card moved to recovery bin");
  };

  const handleUndo = () => {
    if (!selectedCard) return;
    restoreLatestVersion(selectedCard.id);
    setAutosaveText("Latest version restored");
  };

  const applyTool = (tool: string) => {
    if (!selectedCard) return;
    if (tool === "undo") return handleUndo();
    const additions: Record<string, Partial<typeof selectedCard>> = {
      type: { front: `${selectedCard.front}\n\nKey term: ` },
      italic: { back: `${selectedCard.back}\n_Emphasis note_` },
      list: { back: `${selectedCard.back}\n• Main point\n• Supporting detail` },
      equation: { back: `${selectedCard.back}\nΣ examples = clearer recall` },
      image: { back: `${selectedCard.back}\n[Image placeholder added]` },
      audio: { back: `${selectedCard.back}\n[Audio cue attached]` },
    };
    updateCard(additions[tool] ?? {});
    setAutosaveText(`${tool} added`);
  };

  const markStudy = (known: boolean) => {
    setFlipped(false);
    setSessionCount((c) => Math.min(18, c + 1));
    setDueToday((c) => Math.max(0, c - 1));
    setRetention((v) => Math.min(99, v + (known ? 1 : 0)));
    setStreak((v) => (known ? v : Math.max(1, v)));
    setAutosaveText(known ? "Marked as known" : "Scheduled for review");
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const formatTimestamp = (t: number) => new Date(t).toLocaleString();
  const formatDaysAgo = (t: number) => Math.floor(Math.max(0, Date.now() - t) / 86400000);

  return (
    <main className="mlfi-shell min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[8%] top-16 size-56 rounded-full bg-primary/10 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[10%] size-72 rounded-full bg-accent/10 blur-3xl animate-drift-delayed" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft">
              <BookOpen className="size-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">MLFI Studio</p>
              <h1 className="font-display text-lg font-bold leading-none">Micro-Learn</h1>
            </div>
          </Link>

          <div className="hidden flex-1 max-w-md md:block">
            <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search decks…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search decks"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode((v) => !v)}
              aria-label="Toggle theme"
              className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:scale-105 hover:text-primary"
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <span className="hidden lg:inline text-xs font-semibold text-muted-foreground max-w-[140px] truncate">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-md border border-transparent bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition hover:scale-105 hover:bg-destructive/20"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

      </header>

      <div className="relative z-10 mx-auto flex max-w-7xl gap-4 px-4 py-6 pb-24 md:pb-6">
        {/* Side tab rail (desktop) */}
        <aside className="sticky top-24 hidden h-fit w-52 shrink-0 md:block">
          <nav
            role="tablist"
            aria-orientation="vertical"
            aria-label="Studio sections"
            className="flex flex-col gap-1 rounded-2xl border border-border bg-card/80 p-2 shadow-soft backdrop-blur"
          >
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`group relative inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition-all duration-300 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-soft translate-x-0.5"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-0.5"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80 transition-all duration-300 ${
                      active ? "opacity-100" : "opacity-0 -translate-x-2"
                    }`}
                    aria-hidden="true"
                  />
                  <t.icon className="size-4 transition-transform group-hover:scale-110" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
        {/* Autosave bar */}
        <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-card/80 px-3 py-2 text-xs backdrop-blur">
          <span className="inline-flex items-center gap-2 font-semibold text-success">
            <span className="size-2 rounded-full bg-success animate-pulse-save" />
            {autosaveText}
          </span>
          <span className="hidden sm:inline text-muted-foreground">
            Active deck: <strong className="text-foreground">{activeDeck?.name ?? "—"}</strong>
          </span>
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div id="panel-dashboard" role="tabpanel" className="space-y-6 animate-fade-in-up">
            <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 shadow-soft backdrop-blur">
              <p className="inline-flex items-center gap-2 rounded-sm bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                <Zap className="size-3.5" /> Focused workspace
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                Hey there — ready for a quick session?
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {learningPath.map(({ label, icon: Icon }, i) => (
                  <div
                    key={label}
                    style={{ animationDelay: `${i * 80}ms` }}
                    className="group flex animate-fade-in-up items-center gap-2 rounded-md border border-border bg-card/85 px-3 py-2 text-sm font-bold transition hover:-translate-y-0.5 hover:border-primary/50"
                  >
                    <span className="grid size-7 place-items-center rounded-sm bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-4" />
                    </span>
                    {i + 1}. {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-fade-in-up rounded-xl border border-border bg-card/90 p-4 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <s.icon className="size-5 text-primary" />
                  </div>
                  <p className="mt-2 text-3xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
              {/* Decks */}
              <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold">Your decks</h3>
                  <button
                    onClick={addDeck}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:-translate-y-0.5"
                  >
                    <Plus className="size-3.5" /> New deck
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {filteredDecks.map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => selectDeck(deck.id)}
                      className={`group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft ${
                        selectedDeckId === deck.id
                          ? "border-primary bg-secondary"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${deck.color}`} />
                          <span className="font-bold">{deck.name}</span>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{deckCardCounts[deck.id] ?? 0} cards</span>
                        <span>{deck.progress}% mastered</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                          style={{ width: `${deck.progress}%` }}
                        />
                      </div>
                    </button>
                  ))}
                  {!filteredDecks.length && (
                    <p className="text-sm text-muted-foreground">No decks match “{searchTerm}”.</p>
                  )}
                </div>
              </div>

              {/* Mastery ring */}
              <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mastery ring</p>
                <p className="mt-1 text-base font-bold">{activeDeck?.name}</p>
                <div className="mt-4 grid place-items-center">
                  <div className="relative size-40">
                    <svg className="size-40 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                      <circle cx="30" cy="30" r="25" className="fill-none stroke-muted" strokeWidth="6" />
                      <circle
                        cx="30" cy="30" r="25"
                        className="fill-none stroke-primary transition-all duration-700"
                        strokeWidth="6"
                        strokeDasharray="158"
                        strokeDashoffset={masteryOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center text-2xl font-black">
                      {activeDeck?.progress ?? 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <button onClick={() => setTab("study")} className="rounded-md border border-border bg-card p-2 font-bold hover:border-primary/40">
                    Start study
                  </button>
                  <button onClick={() => setTab("editor")} className="rounded-md border border-border bg-card p-2 font-bold hover:border-primary/40">
                    Open editor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDITOR */}
        {tab === "editor" && (
          <div id="panel-editor" role="tabpanel" className="grid gap-5 animate-fade-in-up xl:grid-cols-[1fr_1fr]">
            <section className="min-w-0 rounded-2xl border border-border bg-card/90 p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flashcard editor</p>
                  <h3 className="font-display text-2xl font-bold">Front · Back</h3>
                </div>
                <button
                  onClick={addCard}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
                >
                  <Plus className="size-4" /> New card
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {editorTools.map(({ icon: Icon, action, label }) => (
                  <button
                    key={action}
                    onClick={() => applyTool(action)}
                    title={label}
                    aria-label={`Editor ${label}`}
                    className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:-translate-y-0.5 hover:text-primary hover:shadow-card active:scale-95"
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="front-editor" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Front</label>
                  <textarea
                    id="front-editor"
                    value={selectedCard?.front ?? ""}
                    onChange={(e) => updateCard({ front: e.target.value })}
                    className="min-h-40 w-full resize-none rounded-md border border-input bg-background p-4 text-sm focus:border-primary"
                    placeholder="Question, prompt or concept…"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="back-editor" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Back</label>
                  <textarea
                    id="back-editor"
                    value={selectedCard?.back ?? ""}
                    onChange={(e) => updateCard({ back: e.target.value })}
                    className="min-h-40 w-full resize-none rounded-md border border-input bg-background p-4 text-sm focus:border-primary"
                    placeholder="Answer, explanation or formula…"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t}
                    onClick={() => updateCard({ template: t })}
                    className={`rounded-md border px-3 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 ${
                      selectedTemplate === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-border bg-gradient-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h4 className="font-bold">Live preview</h4>
                <span className="rounded-sm bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">{selectedTemplate}</span>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {selectedTags[0] ?? activeDeck?.name ?? "study"}
                </p>
                <p className="mt-3 break-words whitespace-pre-line text-xl font-bold">
                  {selectedCard?.back ?? "Create a card to preview it."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sigma className="size-4" /> Equation-ready
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-surface-tinted p-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Cards in deck</span>
                  <span>{deckCards.length}</span>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {deckCards.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCardId(c.id)}
                      className={`min-w-32 rounded-md border px-3 py-2 text-left text-xs font-semibold transition hover:-translate-y-0.5 ${
                        selectedCardId === c.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card"
                      }`}
                    >
                      <span className="block truncate">{c.front || "(empty)"}</span>
                    </button>
                  ))}
                  {!deckCards.length && (
                    <p className="text-xs text-muted-foreground">No cards yet — click “New card”.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* STUDY */}
        {tab === "study" && (
          <div id="panel-study" role="tabpanel" className="mx-auto max-w-3xl animate-fade-in-up">
            <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Study mode</p>
                  <h3 className="font-display text-2xl font-bold">Flip + spaced review</h3>
                </div>
                <button
                  onClick={() => setFlipped((v) => !v)}
                  aria-label="Flip card"
                  className="rounded-md bg-secondary p-2 text-secondary-foreground transition hover:rotate-6 hover:scale-105"
                >
                  <ArrowLeftRight className="size-5" />
                </button>
              </div>

              <button
                onClick={() => setFlipped((v) => !v)}
                className="study-perspective mt-5 block w-full text-left"
                aria-label="Interactive flashcard, click to flip"
              >
                <div
                  className={`study-card-inner relative min-h-72 rounded-2xl transition duration-500 motion-reduce:transition-none ${
                    flipped ? "rotate-y-180" : ""
                  }`}
                >
                  <div className="study-card-face absolute inset-0 overflow-hidden rounded-2xl border border-border bg-study-front p-6 text-primary-foreground shadow-soft">
                    <div className="absolute -right-10 -top-10 size-32 rounded-full border border-primary-foreground/20" />
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Question</p>
                    <p className="mt-8 text-2xl font-bold leading-tight">
                      {selectedCard?.front ?? "Create a card to study."}
                    </p>
                    <p className="mt-10 text-sm opacity-80">Tap to reveal answer</p>
                  </div>
                  <div className="study-card-face absolute inset-0 rotate-y-180 overflow-hidden rounded-2xl border border-border bg-study-back p-6 text-primary-foreground shadow-soft">
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Answer</p>
                    <p className="mt-8 whitespace-pre-line text-2xl font-bold leading-tight">
                      {selectedCard?.back ?? "No answer yet."}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => markStudy(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-3 font-bold transition hover:-translate-y-0.5 hover:border-warning hover:text-warning"
                >
                  <RotateCcw className="size-4" /> Review again
                </button>
                <button
                  onClick={() => markStudy(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-success px-3 py-3 font-bold text-success-foreground transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <Check className="size-4" /> Know
                </button>
              </div>

              <div className="mt-5 rounded-md border border-border bg-surface-tinted p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Session progress</span>
                  <span>{sessionCount} / 18</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                    style={{ width: `${(sessionCount / 18) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
                  <Keyboard className="size-3.5 text-primary" /> <kbd className="font-bold">F</kbd> flip
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
                  <Keyboard className="size-3.5 text-primary" /> <kbd className="font-bold">N</kbd> next
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SAFETY */}
        {tab === "safety" && (
          <div id="panel-safety" role="tabpanel" className="grid gap-5 animate-fade-in-up lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Safety flow</h3>
                <button
                  onClick={() => setShowSafety(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition hover:-translate-y-0.5"
                >
                  <Trash2 className="size-4" /> Delete current card
                </button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Destructive actions trigger confirmation dialogs. Deleted cards stay in the recovery
                bin for 30 days. Edits are auto-saved and versioned.
              </p>

              {showSafety && (
                <div className="mt-4 rounded-md border border-destructive/40 bg-card p-4 shadow-soft animate-scale-in" role="alertdialog" aria-modal="true">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">Delete this flashcard?</p>
                      <p className="mt-1 text-sm text-muted-foreground">Reversible from the recovery bin for 30 days.</p>
                    </div>
                    <button onClick={() => setShowSafety(false)} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={confirmDelete} className="rounded-md bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground">Delete</button>
                    <button onClick={() => setShowSafety(false)} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-bold">Cancel</button>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <h4 className="text-sm font-bold">Recovery bin ({trash.length})</h4>
                <div className="mt-2 space-y-2">
                  {!trash.length && (
                    <p className="text-xs text-muted-foreground">No deleted cards in the recovery window.</p>
                  )}
                  {trash.map((item) => (
                    <div key={item.id} className="rounded-md border border-border bg-card p-2">
                      <p className="truncate text-sm font-semibold">{item.front}</p>
                      <p className="text-xs text-muted-foreground">Deleted {formatDaysAgo(item.deletedAt)} day(s) ago</p>
                      <button
                        onClick={() => {
                          restoreCardFromTrash(item.id);
                          setAutosaveText("Card restored");
                        }}
                        className="mt-2 rounded-sm border border-border px-2 py-1 text-xs font-semibold hover:border-primary/40 hover:text-primary"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Version history</h3>
                <button onClick={handleUndo} className="text-xs font-semibold text-primary hover:underline">
                  Restore latest
                </button>
              </div>
              {!cardHistory.length && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No previous versions yet. Edit the current card to generate snapshots.
                </p>
              )}
              {cardHistory.length > 0 && (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {cardHistory.map((entry) => (
                    <div key={entry.timestamp} className="rounded-md border border-border bg-surface-raised p-2">
                      <p className="text-xs font-semibold">{formatTimestamp(entry.timestamp)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.front}</p>
                      <button
                        onClick={() => {
                          if (!selectedCard) return;
                          restoreCardVersion(selectedCard.id, entry.timestamp);
                          setAutosaveText("Previous version restored");
                        }}
                        className="mt-2 rounded-sm border border-border px-2 py-1 text-xs font-semibold hover:border-primary/40 hover:text-primary"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 inline-flex items-center gap-2 text-xs text-success">
                <Save className="size-4" /> Auto-save active
              </div>
            </section>
          </div>
        )}

        {/* ABOUT */}
        {tab === "about" && (
          <div id="panel-about" role="tabpanel" className="space-y-6 animate-fade-in-up">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-soft">
              <p className="text-xs font-black uppercase tracking-wider text-primary">About Spark Study</p>
              <h3 className="mt-2 font-display text-2xl font-bold">Your calm, focused flashcard studio.</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                MLFI (Micro-Learning Flashcard Interface) is built to help you capture, encode, and master what matters without the noise of traditional study apps.
              </p>
            </div>

            {/* How to use */}
            <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-card">
              <p className="text-xs font-black uppercase tracking-wider text-primary">Getting started</p>
              <h3 className="mt-2 font-display text-2xl font-bold">How to use MLFI in 5 minutes</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                A quick tour for new learners — follow these steps to go from empty workspace to your
                first study session.
              </p>

              <ol className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    n: "1",
                    title: "Create a deck",
                    body: "Open the Dashboard tab and click New deck. Decks group related cards (e.g. Biology, Spanish verbs).",
                  },
                  {
                    n: "2",
                    title: "Add cards in the Editor",
                    body: "Switch to Editor, hit New card, then write the Front (question) and Back (answer). Pick a template like Formula or Q&A.",
                  },
                  {
                    n: "3",
                    title: "Use rich tools",
                    body: "Use the toolbar for equations, lists, image cues and emphasis. Every change is auto-saved and versioned.",
                  },
                  {
                    n: "4",
                    title: "Study with flip cards",
                    body: "Open the Study tab. Tap the card or press F to flip. Mark Know or Review again — your retention and streak update live.",
                  },
                  {
                    n: "5",
                    title: "Stay safe",
                    body: "Deleted cards live in the Safety tab's recovery bin for 30 days. Restore old edits from version history any time.",
                  },
                  {
                    n: "6",
                    title: "Track progress",
                    body: "Return to the Dashboard for retention %, streak and the mastery ring across all decks.",
                  },
                ].map((s, i) => (
                  <li
                    key={s.n}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="animate-fade-in-up flex gap-3 rounded-xl border border-border bg-surface-tinted p-4"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-primary text-sm font-black text-primary-foreground shadow-soft">
                      {s.n}
                    </span>
                    <div>
                      <p className="font-bold">{s.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-card p-3 text-sm">
                  <p className="font-bold">Keyboard shortcuts</p>
                  <p className="mt-1 text-muted-foreground">
                    <kbd className="rounded border border-border px-1.5 font-mono text-xs">F</kbd> flip ·{" "}
                    <kbd className="rounded border border-border px-1.5 font-mono text-xs">N</kbd> next card
                  </p>
                </div>
                <div className="rounded-md border border-border bg-card p-3 text-sm">
                  <p className="font-bold">Accessibility</p>
                  <p className="mt-1 text-muted-foreground">
                    Full ARIA tablist, dark mode, motion-reduce support and visible focus rings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </section>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        role="tablist"
        aria-label="Studio sections (mobile)"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 px-2 py-2 backdrop-blur-xl shadow-[0_-4px_24px_-10px_rgba(0,0,0,0.15)] md:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-around">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t.key}`}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-bold uppercase tracking-tight transition-all duration-300 ${
                  active ? "text-primary scale-110" : "text-muted-foreground"
                }`}
              >
                <t.icon className={`size-5 transition-transform ${active ? "animate-scale-in" : ""}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
};

export default Index;
