import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Image,
  Italic,
  Keyboard,
  Layers3,
  List,
  Moon,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Sigma,
  Sparkles,
  Sun,
  Tags,
  Target,
  Trash2,
  Type,
  Undo2,
  Volume2,
  Zap,
  X,
} from "lucide-react";
import { useStudyData } from "@/hooks/use-study-data";

const templates = ["Definition", "Formula", "Q&A", "Diagram"];

const editorTools = [
  { icon: Type, action: "type", label: "Key term" },
  { icon: Italic, action: "italic", label: "Emphasis" },
  { icon: List, action: "list", label: "List" },
  { icon: Sigma, action: "equation", label: "Equation" },
  { icon: Image, action: "image", label: "Image cue" },
  { icon: Volume2, action: "audio", label: "Audio cue" },
  { icon: Undo2, action: "undo", label: "Undo" },
  { icon: Redo2, action: "redo", label: "Redo" },
];

const principles = [
  {
    title: "Safety",
    text: "Auto-save, undo/redo, restore history, and delete confirmation reduce costly mistakes.",
  },
  {
    title: "Utility",
    text: "Rich text, equations, imagery, audio cues, tags, and templates support real coursework.",
  },
  {
    title: "Efficiency",
    text: "One-click creation, shortcuts, smart templates, and inline editing minimize setup effort.",
  },
  {
    title: "Effectiveness",
    text: "Flip, quiz, timed review, and spaced repetition address different learning strategies.",
  },
];

const learningPath = [
  { label: "Capture", icon: Layers3 },
  { label: "Encode", icon: Brain },
  { label: "Recall", icon: Target },
  { label: "Master", icon: Award },
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

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("spark-study-theme") === "dark",
  );
  const [flipped, setFlipped] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
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

  useEffect(() => {
    if (!decks.length) {
      setSelectedDeckId("");
      return;
    }

    if (!selectedDeckId || !decks.some((deck) => deck.id === selectedDeckId)) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  useEffect(() => {
    if (!selectedDeckId) {
      setSelectedCardId("");
      return;
    }

    const cardsInDeck = cards.filter((card) => card.deckId === selectedDeckId);
    if (!cardsInDeck.length) {
      setSelectedCardId("");
      return;
    }

    if (
      !selectedCardId ||
      !cardsInDeck.some((card) => card.id === selectedCardId)
    ) {
      setSelectedCardId(cardsInDeck[0].id);
    }
  }, [cards, selectedDeckId, selectedCardId]);

  const selectedCard =
    cards.find((card) => card.id === selectedCardId) ?? cards[0];
  const selectedTemplate = selectedCard?.template ?? "Formula";
  const selectedTags = selectedCard?.tags ?? [];

  const filteredDecks = useMemo(
    () =>
      decks.filter((deck) =>
        deck.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [decks, searchTerm],
  );

  const activeDeck =
    decks.find((deck) => deck.id === selectedDeckId) ?? decks[0];
  const deckCards = useMemo(
    () => cards.filter((card) => card.deckId === selectedDeckId),
    [cards, selectedDeckId],
  );
  const masteryOffset = 158 - (158 * (activeDeck?.progress ?? 0)) / 100;
  const cardHistory = selectedCard?.history.slice().reverse() ?? [];

  const stats = [
    { label: "Retention", value: `${retention}%`, icon: Brain },
    { label: "Study streak", value: `${streak} days`, icon: Sparkles },
    { label: "Due today", value: `${dueToday}`, icon: Clock3 },
  ];

  const updateCard = (
    updates: Partial<{
      front: string;
      back: string;
      tags: string[];
      template: string;
    }>,
  ) => {
    if (!selectedCard) return;
    updatePersistedCard(selectedCard.id, updates);
    setAutosaveText("Editing saved locally");
  };

  const addCard = () => {
    if (!selectedDeckId) return;

    const nextId = addCardData(selectedDeckId, selectedTemplate);
    setSelectedCardId(nextId);
    setFlipped(false);
    setAutosaveText("New card created");
  };

  const addDeck = () => {
    const deckId = addDeckData();
    setSelectedDeckId(deckId);
    setSelectedCardId("");
    setAutosaveText("New deck created");
  };

  const selectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    const firstCard = cards.find((card) => card.deckId === deckId);
    if (firstCard) setSelectedCardId(firstCard.id);
    setFlipped(false);
  };

  const confirmDelete = () => {
    if (!selectedCard) return;

    deleteCard(selectedCard.id);
    setSelectedCardId("");
    setShowSafety(false);
    setAutosaveText("Card moved to recovery history");
  };

  const handleUndo = () => {
    if (!selectedCard) return;
    restoreLatestVersion(selectedCard.id);
    setAutosaveText("Latest version restored");
  };

  const handleRedo = () => {
    setAutosaveText("Redo is replaced by persistent version history");
  };

  const applyTool = (tool: string) => {
    if (!selectedCard) return;

    const additions: Record<string, Partial<typeof selectedCard>> = {
      type: { front: `${selectedCard.front}\n\nKey term: ` },
      italic: { back: `${selectedCard.back}\n_Emphasis note_` },
      list: { back: `${selectedCard.back}\n• Main point\n• Supporting detail` },
      equation: { back: `${selectedCard.back}\nΣ examples = clearer recall` },
      image: { back: `${selectedCard.back}\n[Image placeholder added]` },
      audio: { back: `${selectedCard.back}\n[Audio cue attached]` },
    };

    if (tool === "undo") return handleUndo();
    if (tool === "redo") return handleRedo();
    updateCard(additions[tool] ?? {});
  };

  const markStudy = (known: boolean) => {
    setFlipped(false);
    setSessionCount((count) => Math.min(18, count + 1));
    setDueToday((count) => Math.max(0, count - 1));
    setRetention((value) => Math.min(99, value + (known ? 1 : 0)));
    setStreak((value) => (known ? value : Math.max(1, value)));
    setAutosaveText(known ? "Marked as known" : "Scheduled for review");
  };

  const formatTimestamp = (timestamp: number) =>
    new Date(timestamp).toLocaleString();

  const formatDaysAgo = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  };

  return (
    <main className="mlfi-shell min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[8%] top-16 size-56 rounded-full bg-primary/10 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[10%] size-72 rounded-full bg-accent/10 blur-3xl animate-drift-delayed" />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="relative z-10 border-b border-border/70 bg-sidebar/90 px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  MLFI Studio
                </p>
                <h1 className="font-display text-2xl font-bold leading-none text-foreground">
                  Micro-Learn
                </h1>
              </div>
            </div>
            <button
              aria-label="Toggle high contrast theme"
              onClick={() => setDarkMode((value) => !value)}
              className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:scale-105 hover:text-primary"
            >
              {darkMode ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>

          <label className="mt-7 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-card">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Search decks, tags, equations..."
            />
          </label>

          <div className="mt-7 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Decks & categories
              </p>
              <button
                aria-label="Create deck"
                onClick={addDeck}
                className="rounded-md bg-primary p-1.5 text-primary-foreground transition hover:scale-105"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {filteredDecks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => selectDeck(deck.id)}
                className={`group w-full rounded-md border p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft ${
                  selectedDeckId === deck.id
                    ? "border-primary bg-secondary"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`size-2.5 rounded-full ${deck.color}`} />
                    <span className="font-semibold text-card-foreground">
                      {deck.name}
                    </span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{deckCardCounts[deck.id] ?? 0} cards</span>
                  <span>{deck.progress}% mastered</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-primary"
                    style={{ width: `${deck.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-7 overflow-hidden rounded-md border border-border bg-gradient-card p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mastery ring
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {activeDeck?.name}
                </p>
              </div>
              <div className="relative size-16">
                <svg
                  className="size-16 -rotate-90"
                  viewBox="0 0 60 60"
                  aria-hidden="true"
                >
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    className="fill-none stroke-muted"
                    strokeWidth="7"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    className="fill-none stroke-primary transition-all duration-700"
                    strokeWidth="7"
                    strokeDasharray="158"
                    strokeDashoffset={masteryOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-sm font-black text-foreground">
                  {activeDeck?.progress}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-md border border-border bg-gradient-card p-4 shadow-card">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Keyboard className="size-4 text-primary" />
              Fast path
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <button
                onClick={addCard}
                className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary"
              >
                N New
              </button>
              <button
                onClick={() => setFlipped((value) => !value)}
                className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary"
              >
                F Flip
              </button>
              <button
                onClick={handleUndo}
                className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary"
              >
                ⌘Z Undo
              </button>
              <button
                onClick={() => setAutosaveText("Saved manually")}
                className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary"
              >
                S Save
              </button>
            </div>
          </div>
        </aside>

        <section className="relative z-10 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <header className="relative overflow-hidden rounded-md border border-border bg-card/85 p-4 shadow-soft backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-sm bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                  <Zap className="size-4" /> Focused learning workspace
                </p>
                <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                  Create, protect, and study rich flashcards.
                </h2>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {learningPath.map(({ label, icon: Icon }, index) => (
                    <div
                      key={label}
                      className="group flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-bold text-foreground transition hover:-translate-y-0.5 hover:border-primary/50"
                    >
                      <span className="grid size-7 place-items-center rounded-sm bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span>
                        {index + 1}. {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowHistory((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <RotateCcw className="size-4" /> History
                </button>
                <button
                  onClick={addCard}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
                >
                  <Plus className="size-4" /> New card
                </button>
              </div>
            </div>
          </header>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="animate-float-in rounded-md border border-border bg-card/90 p-4 shadow-card backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <stat.icon className="size-5 text-primary" />
                </div>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-md border border-border bg-card/90 shadow-soft backdrop-blur-xl">
              <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Flashcard creation module
                  </p>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Front | Back split editor
                  </h3>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                  <span className="size-2 rounded-full bg-success animate-pulse-save" />
                  {autosaveText}
                </div>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-md border border-border bg-surface-raised p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {editorTools.map(({ icon: Icon, action, label }) => (
                      <button
                        key={action}
                        onClick={() => applyTool(action)}
                        title={label}
                        aria-label={`Editor ${action}`}
                        className="group rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:-translate-y-0.5 hover:text-primary hover:shadow-card active:scale-95"
                      >
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <label
                      className="text-sm font-bold text-foreground"
                      htmlFor="front-editor"
                    >
                      Front
                    </label>
                    <textarea
                      id="front-editor"
                      value={selectedCard?.front ?? ""}
                      onChange={(event) =>
                        updateCard({ front: event.target.value })
                      }
                      className="min-h-36 w-full resize-none rounded-md border border-input bg-background p-4 text-ink-soft shadow-inner"
                    />
                    <label
                      className="text-sm font-bold text-foreground"
                      htmlFor="back-editor"
                    >
                      Back
                    </label>
                    <textarea
                      id="back-editor"
                      value={selectedCard?.back ?? ""}
                      onChange={(event) =>
                        updateCard({ back: event.target.value })
                      }
                      className="min-h-44 w-full resize-none rounded-md border border-input bg-background p-4 text-ink-soft shadow-inner"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-border bg-gradient-card p-4 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-foreground">Live preview</h4>
                    <span className="rounded-sm bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                      {selectedTemplate}
                    </span>
                  </div>
                  <div className="mt-4 rounded-md border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      {selectedTags[0] ?? activeDeck?.name ?? "study"}
                    </p>
                    <p className="mt-3 whitespace-pre-line text-xl font-bold text-foreground">
                      {selectedCard?.back ?? "Create a card to preview it."}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Sigma className="size-4" /> Equation-ready content
                    </div>
                  </div>
                  <div className="mt-4 rounded-md border border-border bg-surface-tinted p-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Cards in deck</span>
                      <span>{deckCards.length}</span>
                    </div>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {deckCards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`min-w-32 rounded-md border px-3 py-2 text-left text-xs font-semibold transition hover:-translate-y-0.5 ${selectedCardId === card.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground"}`}
                        >
                          <span className="block truncate">{card.front}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template}
                        onClick={() => updateCard({ template })}
                        className={`rounded-md border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${selectedTemplate === template ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary/40"}`}
                      >
                        {template}
                      </button>
                    ))}
                  </div>

                  {showHistory && (
                    <div className="mt-4 rounded-md border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-foreground">
                          Version history
                        </h5>
                        <button
                          onClick={handleUndo}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Restore latest
                        </button>
                      </div>
                      {!cardHistory.length && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          No previous versions yet. Edit this card to generate
                          history snapshots.
                        </p>
                      )}
                      {cardHistory.length > 0 && (
                        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                          {cardHistory.map((entry) => (
                            <div
                              key={entry.timestamp}
                              className="rounded-md border border-border bg-surface-raised p-2"
                            >
                              <p className="text-xs font-semibold text-foreground">
                                {formatTimestamp(entry.timestamp)}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {entry.front}
                              </p>
                              <button
                                onClick={() => {
                                  if (!selectedCard) return;
                                  restoreCardVersion(
                                    selectedCard.id,
                                    entry.timestamp,
                                  );
                                  setAutosaveText(
                                    "A previous version was restored",
                                  );
                                }}
                                className="mt-2 rounded-sm border border-border px-2 py-1 text-xs font-semibold text-card-foreground hover:border-primary/40 hover:text-primary"
                              >
                                Restore
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border bg-card/90 p-4 shadow-soft backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Study mode
                  </p>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Flip + spaced review
                  </h3>
                </div>
                <button
                  onClick={() => setFlipped((value) => !value)}
                  className="rounded-md bg-secondary p-2 text-secondary-foreground transition hover:rotate-6 hover:scale-105"
                  aria-label="Flip card"
                >
                  <ArrowLeftRight className="size-5" />
                </button>
              </div>

              <button
                onClick={() => setFlipped((value) => !value)}
                className="study-perspective mt-5 block w-full text-left"
                aria-label="Interactive flashcard"
              >
                <div
                  className={`study-card-inner relative min-h-72 rounded-md transition duration-500 motion-reduce:transition-none ${flipped ? "rotate-y-180" : ""}`}
                >
                  <div className="study-card-face absolute inset-0 overflow-hidden rounded-md border border-border bg-study-front p-6 text-primary-foreground shadow-soft">
                    <div className="absolute -right-10 -top-10 size-32 rounded-full border border-primary-foreground/20" />
                    <div className="absolute bottom-5 right-5 flex gap-1 opacity-50">
                      <span className="size-2 rounded-full bg-primary-foreground animate-pulse" />
                      <span className="size-2 rounded-full bg-primary-foreground animate-pulse [animation-delay:150ms]" />
                      <span className="size-2 rounded-full bg-primary-foreground animate-pulse [animation-delay:300ms]" />
                    </div>
                    <p className="text-sm font-semibold opacity-80">Question</p>
                    <p className="mt-8 text-2xl font-bold leading-tight">
                      {selectedCard?.front ?? "Create a card to study."}
                    </p>
                    <p className="mt-10 text-sm opacity-80">
                      Tap to reveal answer
                    </p>
                  </div>
                  <div className="study-card-face absolute inset-0 rotate-y-180 overflow-hidden rounded-md border border-border bg-study-back p-6 text-primary-foreground shadow-soft">
                    <div className="absolute -left-12 bottom-0 size-36 rounded-full border border-primary-foreground/20" />
                    <p className="text-sm font-semibold opacity-80">Answer</p>
                    <p className="mt-8 whitespace-pre-line text-2xl font-bold leading-tight">
                      {selectedCard?.back ?? "No answer yet."}
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => markStudy(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-3 font-bold text-card-foreground transition hover:-translate-y-0.5 hover:border-warning hover:text-warning"
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
                <div className="flex items-center justify-between text-sm font-semibold text-secondary-foreground">
                  <span>Session progress</span>
                  <span>{sessionCount} / 18</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-gradient-primary"
                    style={{ width: `${(sessionCount / 18) * 100}%` }}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-md border border-border bg-card/90 p-4 shadow-card backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  Safety flow
                </h3>
                <button
                  onClick={() => setShowSafety(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive transition hover:-translate-y-0.5"
                >
                  <Trash2 className="size-4" /> Delete card
                </button>
              </div>
              <div className="mt-4 rounded-md border border-border bg-muted/60 p-4">
                <p className="text-sm text-muted-foreground">
                  Destructive actions trigger confirmation, while unsaved exits
                  offer Save, Discard, or Cancel paths.
                </p>
              </div>
              <div className="mt-4 rounded-md border border-border bg-surface-tinted p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">
                    Recovery bin
                  </p>
                  <button
                    onClick={() => setShowTrash((value) => !value)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {showTrash ? "Hide" : `Show (${trash.length})`}
                  </button>
                </div>
                {showTrash && (
                  <div className="mt-3 space-y-2">
                    {!trash.length && (
                      <p className="text-xs text-muted-foreground">
                        No deleted cards in the 30-day recovery window.
                      </p>
                    )}
                    {trash.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-border bg-card p-2"
                      >
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.front}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Deleted {formatDaysAgo(item.deletedAt)} day(s) ago
                        </p>
                        <button
                          onClick={() => {
                            restoreCardFromTrash(item.id);
                            setAutosaveText("Deleted card recovered");
                          }}
                          className="mt-2 rounded-sm border border-border px-2 py-1 text-xs font-semibold text-card-foreground hover:border-primary/40 hover:text-primary"
                        >
                          Restore card
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {showSafety && (
                <div className="mt-4 rounded-md border border-destructive/40 bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">
                        Delete this flashcard?
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This action is reversible from version history for 30
                        days.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSafety(false)}
                      aria-label="Close dialog"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={confirmDelete}
                      className="rounded-md bg-destructive px-3 py-2 text-sm font-bold text-destructive-foreground"
                    >
                      Delete
                    </button>
                    <button
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm font-bold text-card-foreground"
                      onClick={() => setShowSafety(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-md border border-border bg-card/90 p-4 shadow-card backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  HCI design mapping
                </h3>
                <BarChart3 className="size-5 text-primary" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {principles.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-md border border-border bg-surface-raised p-4 transition hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <FileText className="size-4 text-primary" /> {item.title}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <footer className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-card/85 p-4 text-sm text-muted-foreground shadow-card backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2">
                <Tags className="size-4 text-primary" /> Tags:{" "}
                {selectedTags.length ? selectedTags.join(", ") : "new"},{" "}
                {selectedCard?.template.toLowerCase() ?? "template"}, exam
              </span>
              <button
                onClick={() => setAutosaveText("Saved manually")}
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <Save className="size-4 text-success" /> Reliable auto-save
                enabled
              </button>
            </div>
            <span>
              Designed for keyboard navigation, readable contrast, and low
              cognitive load.
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default Index;
