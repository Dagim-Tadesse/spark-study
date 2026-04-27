import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
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
import EmptyState from "@/components/EmptyState";
import {
  validateDeckName,
  validateCardText,
  getCardTextWarning,
  CARD_TEXT_MAX_LENGTH,
} from "@/lib/validation";

const initialDecks = [
  {
    name: "Physics Formulas",
    cards: 42,
    progress: 72,
    color: "bg-study-front",
  },
  { name: "Spanish Verbs", cards: 28, progress: 54, color: "bg-success" },
  { name: "HCI Principles", cards: 36, progress: 88, color: "bg-accent" },
];

const initialCards = [
  {
    id: 1,
    deck: "Physics Formulas",
    template: "Formula",
    front: "What is the relationship between force, mass, and acceleration?",
    back: "Newton's Second Law\nF = m × a\nForce equals mass multiplied by acceleration.",
    tag: "physics",
  },
  {
    id: 2,
    deck: "HCI Principles",
    template: "Q&A",
    front: "Which HCI principle prevents accidental data loss?",
    back: "Safety: auto-save, confirmation prompts, undo/redo, and version history.",
    tag: "hci",
  },
];

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
  const [darkMode, setDarkMode] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [decks, setDecks] = useState(initialDecks);
  const [cards, setCards] = useState(initialCards);
  const [selectedDeck, setSelectedDeck] = useState(initialDecks[0].name);
  const [selectedCardId, setSelectedCardId] = useState(initialCards[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionCount, setSessionCount] = useState(12);
  const [streak, setStreak] = useState(9);
  const [retention, setRetention] = useState(86);
  const [dueToday, setDueToday] = useState(18);
  const [autosaveText, setAutosaveText] = useState("Auto-saved just now");
  const [history, setHistory] = useState<typeof initialCards>(initialCards);
  const [redoStack, setRedoStack] = useState<typeof initialCards>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [textWarning, setTextWarning] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const selectedCard =
    cards.find((card) => card.id === selectedCardId) ?? cards[0];
  const selectedTemplate = selectedCard?.template ?? "Formula";

  const filteredDecks = useMemo(
    () =>
      decks.filter((deck) =>
        deck.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [decks, searchTerm],
  );

  const activeDeck =
    decks.find((deck) => deck.name === selectedDeck) ?? decks[0];
  const deckCards = useMemo(
    () => cards.filter((card) => card.deck === selectedDeck),
    [cards, selectedDeck],
  );
  const masteryOffset = 158 - (158 * (activeDeck?.progress ?? 0)) / 100;

  const stats = [
    { label: "Retention", value: `${retention}%`, icon: Brain },
    { label: "Study streak", value: `${streak} days`, icon: Sparkles },
    { label: "Due today", value: `${dueToday}`, icon: Clock3 },
  ];

  const rememberState = () => {
    setHistory(cards);
    setRedoStack([]);
  };

  const updateCard = (updates: Partial<(typeof initialCards)[number]>) => {
    if (!selectedCard) return;

    // Validate card text if provided
    if (updates.front !== undefined) {
      const frontValidation = validateCardText(updates.front);
      if (!frontValidation.isValid) {
        setValidationError(frontValidation.error ?? "Invalid front text");
        return;
      }
      setTextWarning(getCardTextWarning(updates.front));
    }
    if (updates.back !== undefined) {
      const backValidation = validateCardText(updates.back);
      if (!backValidation.isValid) {
        setValidationError(backValidation.error ?? "Invalid back text");
        return;
      }
      const warning = getCardTextWarning(updates.back);
      if (warning) setTextWarning(warning);
    }

    rememberState();
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === selectedCard.id ? { ...card, ...updates } : card,
      ),
    );
    setValidationError(null);
    setAutosaveText("Editing saved locally");
  };

  const addCard = () => {
    const nextId = Math.max(0, ...cards.map((card) => card.id)) + 1;
    const newCard = {
      id: nextId,
      deck: selectedDeck,
      template: selectedTemplate,
      front: "New flashcard question",
      back: "Add the answer, example, or equation here.",
      tag: selectedDeck.split(" ")[0].toLowerCase(),
    };

    rememberState();
    setCards((currentCards) => [...currentCards, newCard]);
    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.name === selectedDeck ? { ...deck, cards: deck.cards + 1 } : deck,
      ),
    );
    setSelectedCardId(nextId);
    setFlipped(false);
    setAutosaveText("New card created");
  };

  const addDeck = () => {
    const nextNumber = decks.length + 1;
    const deckName = `New Deck ${nextNumber}`;

    // Validate deck name
    const validation = validateDeckName(deckName);
    if (!validation.isValid) {
      setValidationError(validation.error ?? "Invalid deck name");
      return;
    }

    const newDeck = {
      name: deckName,
      cards: 0,
      progress: 0,
      color: "bg-primary",
    };

    setDecks((currentDecks) => [...currentDecks, newDeck]);
    setSelectedDeck(deckName);
    setValidationError(null);
    setAutosaveText("New deck created");
  };

  const selectDeck = (deckName: string) => {
    setSelectedDeck(deckName);
    const firstCard = cards.find((card) => card.deck === deckName);
    if (firstCard) setSelectedCardId(firstCard.id);
    setFlipped(false);
  };

  const confirmDelete = () => {
    if (!selectedCard) return;
    rememberState();
    const remainingCards = cards.filter((card) => card.id !== selectedCard.id);
    setCards(remainingCards);
    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.name === selectedCard.deck
          ? { ...deck, cards: Math.max(0, deck.cards - 1) }
          : deck,
      ),
    );
    setSelectedCardId(remainingCards[0]?.id ?? 0);
    setShowSafety(false);
    setAutosaveText("Card moved to recovery history");
  };

  const handleUndo = () => {
    setRedoStack(cards);
    setCards(history);
    setSelectedCardId(history[0]?.id ?? 0);
    setAutosaveText("Undo applied");
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    setHistory(cards);
    setCards(redoStack);
    setSelectedCardId(redoStack[0]?.id ?? 0);
    setRedoStack([]);
    setAutosaveText("Redo applied");
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
    setDecks((currentDecks) =>
      currentDecks.map((deck) =>
        deck.name === activeDeck.name
          ? {
              ...deck,
              progress: Math.min(100, deck.progress + (known ? 2 : 1)),
            }
          : deck,
      ),
    );
    setAutosaveText(known ? "Marked as known" : "Scheduled for review");
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
                key={deck.name}
                onClick={() => selectDeck(deck.name)}
                className={`group w-full rounded-md border p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft ${
                  selectedDeck === deck.name
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
                  <span>{deck.cards} cards</span>
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
            {filteredDecks.length === 0 && (
              <EmptyState type="decks" onAction={addDeck} />
            )}
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
                  onClick={handleUndo}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <RotateCcw className="size-4" /> Version history
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
              {validationError && (
                <div className="mx-4 mt-2 flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                  <AlertCircle className="size-4" />
                  {validationError}
                </div>
              )}
              {textWarning && !validationError && (
                <div className="mx-4 mt-2 flex items-center gap-2 rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm font-semibold text-warning">
                  <AlertCircle className="size-4" />
                  {textWarning}
                </div>
              )}

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
                      {selectedCard?.tag ?? activeDeck.name}
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
                      {deckCards.length === 0 && (
                        <EmptyState type="cards" onAction={addCard} />
                      )}
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
                {selectedCard?.tag ?? "new"},{" "}
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
