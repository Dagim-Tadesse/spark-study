import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Clock3,
  Image,
  Italic,
  Keyboard,
  List,
  LogOut,
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
  Trash2,
  Type,
  Undo2,
  Volume2,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import { profileService, Profile } from "../services/profileService";

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

const Index = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [darkMode, setDarkMode] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [decks, setDecks] = useState<(Deck & { progress?: number })[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [autosaveText, setAutosaveText] = useState("Up to date");
  const [history, setHistory] = useState<Card[]>([]);
  const [redoStack, setRedoStack] = useState<Card[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedDecks, fetchedCards, fetchedProfile] = await Promise.all([
          deckService.getDecks(user.id),
          cardService.getCards(user.id),
          profileService.getProfile(user.id)
        ]);
        
        const decksWithStats = fetchedDecks.map(d => ({ ...d, progress: 0 }));
        setDecks(decksWithStats);
        setCards(fetchedCards);
        setProfile(fetchedProfile);

        if (decksWithStats.length > 0) {
          setSelectedDeckId(decksWithStats[0].id);
          const firstDeckCards = fetchedCards.filter(c => c.deck_id === decksWithStats[0].id);
          if (firstDeckCards.length > 0) {
            setSelectedCardId(firstDeckCards[0].id);
          }
        }
      } catch (error) {
        console.error(error);
        setAutosaveText("Error loading data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredDecks = useMemo(
    () => decks.filter((deck) => deck.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [decks, searchTerm]
  );

  const activeDeck = decks.find((deck) => deck.id === selectedDeckId) ?? decks[0];
  const deckCards = useMemo(() => cards.filter((card) => card.deck_id === selectedDeckId), [cards, selectedDeckId]);
  
  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? deckCards[0];
  const selectedTemplate = selectedCard?.template ?? "Formula";
  const masteryOffset = 158 - (158 * (activeDeck?.progress ?? 0)) / 100;

  const todayStr = new Date().toDateString();

  // Calculate Due Today based on real cards loaded and their progress
  const dueToday = useMemo(() => {
    if (!cards.length) return 0;
    const now = Date.now();
    return cards.filter(card => {
      // If it has no next_review or it's in the past
      return !card.next_review || card.next_review <= now;
    }).length;
  }, [cards]);

  const retention = profile && profile.total_reviews > 0 
    ? Math.round((profile.successful_reviews / profile.total_reviews) * 100) 
    : 100;

  const streak = profile?.streak ?? 0;

  useEffect(() => {
    // Check if streak is broken on load
    if (profile && profile.last_study_date && profile.last_study_date !== todayStr) {
      const lastDate = new Date(profile.last_study_date);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays > 1) {
        setProfile((prev) => prev ? { ...prev, streak: 0 } : null);
        profileService.updateProfile(user!.id, { streak: 0 }).catch(console.error);
      }
    }
  }, [profile?.last_study_date, user]);

  const stats = [
    { label: "Retention", value: `${retention}%`, icon: Brain },
    { label: "Study streak", value: `${streak} days`, icon: Sparkles },
    { label: "Due today", value: `${dueToday}`, icon: Clock3 },
  ];

  const rememberState = () => {
    setHistory([...cards]);
    setRedoStack([]);
  };

  const updateCard = async (updates: Partial<Card>) => {
    if (!selectedCard) return;
    rememberState();
    
    // Optimistic update
    setCards((currentCards) => currentCards.map((card) => (card.id === selectedCard.id ? { ...card, ...updates } : card)));
    setAutosaveText("Saving...");
    
    try {
      await cardService.updateCard(selectedCard.id, updates);
      setAutosaveText("Saved to cloud");
    } catch (e) {
      console.error(e);
      setAutosaveText("Error saving");
    }
  };

  const addCard = useCallback(async () => {
    if (!user || !selectedDeckId) return;
    rememberState();
    setAutosaveText("Creating...");
    
    try {
      const newCard = await cardService.createCard({
        deck_id: selectedDeckId,
        user_id: user.id,
        template: selectedTemplate,
        front: "",
        back: "",
        tag: activeDeck?.name.split(" ")[0].toLowerCase() || "new",
        next_review: Date.now(),
        interval: 0,
      });
      setCards((currentCards) => [...currentCards, newCard]);
      setSelectedCardId(newCard.id);
      setFlipped(false);
      setAutosaveText("New card created");
      // Focus the front editor automatically
      setTimeout(() => document.getElementById('front-editor')?.focus(), 50);
    } catch (e) {
      console.error(e);
      setAutosaveText("Error creating card");
    }
  }, [user, selectedDeckId, selectedTemplate, activeDeck]);

  const addDeck = async () => {
    if (!user) return;
    setAutosaveText("Creating deck...");
    const nextNumber = decks.length + 1;
    const deckName = `New Deck ${nextNumber}`;
    try {
      const newDeck = await deckService.createDeck(user.id, deckName, "bg-primary");
      setDecks((currentDecks) => [...currentDecks, { ...newDeck, progress: 0 }]);
      setSelectedDeckId(newDeck.id);
      setAutosaveText("New deck created");
    } catch (e) {
      console.error(e);
      setAutosaveText("Error creating deck");
    }
  };

  const selectDeck = (deckId: string) => {
    setSelectedDeckId(deckId);
    const firstCard = cards.find((card) => card.deck_id === deckId);
    if (firstCard) {
      setSelectedCardId(firstCard.id);
    } else {
      setSelectedCardId(null);
    }
    setFlipped(false);
  };

  const confirmDelete = async () => {
    if (!selectedCard) return;
    rememberState();
    const cardId = selectedCard.id;
    
    const remainingCards = cards.filter((card) => card.id !== cardId);
    setCards(remainingCards);
    setSelectedCardId(remainingCards.find(c => c.deck_id === selectedCard.deck_id)?.id ?? null);
    setShowSafety(false);
    setAutosaveText("Deleting...");
    
    try {
      await cardService.deleteCard(cardId);
      setAutosaveText("Card deleted");
    } catch (e) {
      console.error(e);
      setAutosaveText("Error deleting card");
    }
  };

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    setRedoStack([...cards]);
    setCards(history);
    setSelectedCardId(history[0]?.id ?? null);
    setAutosaveText("Undo applied");
  }, [history, cards]);

  const handleRedo = () => {
    if (!redoStack.length) return;
    setHistory([...cards]);
    setCards(redoStack);
    setSelectedCardId(redoStack[0]?.id ?? null);
    setRedoStack([]);
    setAutosaveText("Redo applied");
  };

  const applyTool = (tool: string) => {
    if (!selectedCard) return;

    const additions: Record<string, Partial<Card>> = {
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
    if (!selectedCard || !user || !profile) return;
    setFlipped(false);
    setSessionCount((count) => Math.min(18, count + 1));

    // Update real study stats
    const now = Date.now();
    // basic SM-2 style interval logic
    const currentInterval = selectedCard.interval || 0;
    const newInterval = known ? (currentInterval === 0 ? 1 : currentInterval * 2) : 0;
    const nextReview = now + newInterval * 24 * 60 * 60 * 1000;
    
    let newStreak = profile.streak;
    if (profile.last_study_date !== todayStr) {
      newStreak += 1;
    }

    const updatedProfile = {
      ...profile,
      streak: newStreak,
      last_study_date: todayStr,
      total_reviews: profile.total_reviews + 1,
      successful_reviews: profile.successful_reviews + (known ? 1 : 0),
    };
    
    setProfile(updatedProfile);
    
    updateCard({ interval: newInterval, next_review: nextReview });

    // Background sync profile
    profileService.updateProfile(user.id, {
      streak: newStreak,
      last_study_date: todayStr,
      total_reviews: updatedProfile.total_reviews,
      successful_reviews: updatedProfile.successful_reviews
    }).catch(e => console.error("Failed to update profile", e));

    if (activeDeck) {
      setDecks((currentDecks) =>
        currentDecks.map((deck) => (deck.id === activeDeck.id ? { ...deck, progress: Math.min(100, (deck.progress || 0) + (known ? 2 : 1)) } : deck)),
      );
    }
    setAutosaveText(known ? "Marked as known" : "Scheduled for review");
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addCard();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFlipped(f => !f);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        setAutosaveText("Saved manually");
      } else if (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addCard, handleUndo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="mlfi-shell min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[8%] top-16 size-56 rounded-full bg-primary/10 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[10%] size-72 rounded-full bg-accent/10 blur-3xl animate-drift-delayed" />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col md:flex-row">
        <aside className="relative z-10 flex flex-col border-b border-border/70 bg-sidebar/90 px-4 py-4 backdrop-blur-xl md:h-screen md:w-72 md:shrink-0 md:border-b-0 md:border-r overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft shrink-0">
                <BookOpen className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground truncate">MLFI Studio</p>
                <h1 className="font-display text-2xl font-bold leading-none text-foreground truncate">Micro-Learn</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Toggle high contrast theme"
                onClick={() => setDarkMode((value) => !value)}
                className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:scale-105 hover:text-primary"
              >
                {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </div>
          </div>

          <label className="mt-7 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-card shrink-0">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Search decks, tags..."
            />
          </label>

          <div className="mt-7 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Decks</p>
              <button aria-label="Create deck" onClick={addDeck} className="rounded-md bg-primary p-1.5 text-primary-foreground transition hover:scale-105">
                <Plus className="size-4" />
              </button>
            </div>
            {filteredDecks.map((deck) => {
              const deckCardCount = cards.filter(c => c.deck_id === deck.id).length;
              return (
                <button
                  key={deck.id}
                  onClick={() => selectDeck(deck.id)}
                  className={`group w-full rounded-md border p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft ${
                    selectedDeckId === deck.id ? "border-primary bg-secondary" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`size-2.5 rounded-full shrink-0 ${deck.color}`} />
                      <span className="font-semibold text-card-foreground truncate">{deck.name}</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{deckCardCount} cards</span>
                    <span>{deck.progress || 0}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${deck.progress || 0}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-7 overflow-hidden rounded-md border border-border bg-gradient-card p-4 shadow-card shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mastery ring</p>
                <p className="mt-1 text-sm font-semibold text-foreground truncate">{activeDeck?.name}</p>
              </div>
              <div className="relative size-16 shrink-0">
                <svg className="size-16 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                  <circle cx="30" cy="30" r="25" className="fill-none stroke-muted" strokeWidth="7" />
                  <circle cx="30" cy="30" r="25" className="fill-none stroke-primary transition-all duration-700" strokeWidth="7" strokeDasharray="158" strokeDashoffset={masteryOffset} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-sm font-black text-foreground">{activeDeck?.progress || 0}%</span>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-md border border-border bg-gradient-card p-4 shadow-card shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Keyboard className="size-4 text-primary" />
              Keyboard Shortcuts
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <button onClick={addCard} className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary truncate">N New</button>
              <button onClick={() => setFlipped((value) => !value)} className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary truncate">F Flip</button>
              <button onClick={handleUndo} className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary truncate">⌘Z Undo</button>
              <button onClick={() => setAutosaveText("Saved manually")} className="rounded-sm bg-muted px-2 py-1 text-left hover:text-primary truncate">S Save</button>
            </div>
          </div>

          <div className="mt-auto pt-7 shrink-0">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-secondary/30 p-3 transition hover:bg-secondary/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground font-bold shrink-0 shadow-soft">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <button
                aria-label="Log out"
                onClick={() => signOut()}
                className="rounded-md border border-transparent p-2 text-muted-foreground transition hover:scale-105 hover:bg-destructive/10 hover:text-destructive shrink-0"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        <section className="relative z-10 flex-1 min-w-0 px-4 py-4 sm:px-6 lg:px-8 overflow-y-auto">
          <header className="relative overflow-hidden rounded-md border border-border bg-card/85 p-4 shadow-soft backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-sm bg-primary/10 px-2 py-1 text-sm font-semibold text-primary truncate"><Zap className="size-4 shrink-0" /> Focused learning workspace</p>
                <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl mt-1 truncate">Your Flashcards</h2>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button onClick={handleUndo} className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:-translate-y-0.5 hover:shadow-card">
                  <RotateCcw className="size-4" /> History
                </button>
                <button onClick={addCard} className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5">
                  <Plus className="size-4" /> New card
                </button>
              </div>
            </div>
          </header>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="animate-float-in rounded-md border border-border bg-card/90 p-4 shadow-card backdrop-blur min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate mr-2">{stat.label}</p>
                  <stat.icon className="size-5 text-primary shrink-0" />
                </div>
                <p className="mt-2 text-3xl font-bold text-foreground truncate">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-md border border-border bg-card/90 shadow-soft backdrop-blur-xl min-w-0 flex flex-col">
              <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Card Editor</p>
                  <h3 className="font-display text-2xl font-bold text-foreground truncate">Front | Back split editor</h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm font-semibold text-success max-w-40">
                    <span className="size-2 rounded-full bg-success animate-pulse-save shrink-0" />
                    <span className="truncate">{autosaveText}</span>
                  </div>
                  <button onClick={() => setShowSafety(true)} className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive transition hover:-translate-y-0.5" aria-label="Delete card">
                    <Trash2 className="size-4 shrink-0" />
                  </button>
                </div>
              </div>
              {showSafety && (
                <div className="border-b border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <p className="text-sm font-bold text-foreground">Delete this flashcard permanently?</p>
                  <div className="flex gap-2">
                    <button onClick={confirmDelete} className="rounded-md bg-destructive px-3 py-1.5 text-sm font-bold text-destructive-foreground transition hover:-translate-y-0.5">Delete</button>
                    <button onClick={() => setShowSafety(false)} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-bold text-card-foreground transition hover:-translate-y-0.5">Cancel</button>
                  </div>
                </div>
              )}

              <div className="grid gap-4 p-4 md:grid-cols-[1fr_1fr] flex-1 min-h-0">
                <div className="rounded-md border border-border bg-surface-raised p-4 flex flex-col min-w-0 h-full">
                  <div className="mb-3 flex flex-wrap items-center gap-2 shrink-0">
                    {editorTools.map(({ icon: Icon, action, label }) => (
                      <button key={action} onClick={() => applyTool(action)} title={label} aria-label={`Editor ${action}`} className="group rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:-translate-y-0.5 hover:text-primary hover:shadow-card active:scale-95">
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 flex-1 min-h-0">
                    <label className="text-sm font-bold text-foreground shrink-0" htmlFor="front-editor">Front</label>
                    <textarea
                      id="front-editor"
                      placeholder="New flashcard question..."
                      value={selectedCard?.front ?? ""}
                      onChange={(event) => updateCard({ front: event.target.value })}
                      className="flex-1 min-h-24 w-full resize-none rounded-md border border-input bg-background p-4 text-ink-soft shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <label className="text-sm font-bold text-foreground shrink-0" htmlFor="back-editor">Back</label>
                    <textarea
                      id="back-editor"
                      placeholder="Add the answer, example, or equation here..."
                      value={selectedCard?.back ?? ""}
                      onChange={(event) => updateCard({ back: event.target.value })}
                      className="flex-1 min-h-24 w-full resize-none rounded-md border border-input bg-background p-4 text-ink-soft shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-border bg-gradient-card p-4 shadow-card flex flex-col justify-between min-w-0 h-full">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h4 className="font-bold text-foreground truncate">Live preview</h4>
                      <span className="rounded-sm bg-accent px-2 py-1 text-xs font-bold text-accent-foreground shrink-0">{selectedTemplate}</span>
                    </div>
                    <div className="rounded-md border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary truncate">{selectedCard?.tag ?? activeDeck?.name}</p>
                      <p className="mt-3 whitespace-pre-line text-lg md:text-xl font-bold text-foreground line-clamp-4 break-words">{selectedCard?.back || "Create a card to preview it."}</p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Sigma className="size-4 shrink-0" /> <span className="truncate">Equation-ready content</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 min-w-0">
                    <div className="rounded-md border border-border bg-surface-tinted p-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        <span className="truncate">Cards in deck</span>
                        <span className="shrink-0">{deckCards.length}</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {deckCards.map((card) => (
                          <button key={card.id} onClick={() => setSelectedCardId(card.id)} className={`min-w-32 max-w-32 rounded-md border px-3 py-2 text-left text-xs font-semibold transition hover:-translate-y-0.5 shrink-0 ${selectedCardId === card.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground"}`}>
                            <span className="block truncate">{card.front || "Empty card"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {templates.map((template) => (
                        <button key={template} onClick={() => updateCard({ template })} className={`rounded-md border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 truncate ${selectedTemplate === template ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary/40"}`}>
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border bg-card/90 p-4 shadow-soft backdrop-blur-xl min-w-0 flex flex-col">
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Interactive Study</p>
                  <h3 className="font-display text-2xl font-bold text-foreground truncate">Flashcard Review</h3>
                </div>
                <button onClick={() => setFlipped((value) => !value)} className="rounded-md bg-secondary p-2 text-secondary-foreground transition hover:rotate-6 hover:scale-105 shrink-0" aria-label="Flip card">
                  <ArrowLeftRight className="size-5" />
                </button>
              </div>

              <button onClick={() => setFlipped((value) => !value)} className="study-perspective mt-5 block w-full text-left flex-1 min-h-64" aria-label="Interactive flashcard">
                <div className={`study-card-inner relative h-full w-full rounded-md transition duration-500 motion-reduce:transition-none ${flipped ? "rotate-y-180" : ""}`}>
                  <div className="study-card-face absolute inset-0 overflow-y-auto rounded-md border border-border bg-study-front p-6 text-primary-foreground shadow-soft custom-scrollbar">
                    <div className="absolute -right-10 -top-10 size-32 rounded-full border border-primary-foreground/20" />
                    <div className="absolute bottom-5 right-5 flex gap-1 opacity-50">
                      <span className="size-2 rounded-full bg-primary-foreground animate-pulse" />
                      <span className="size-2 rounded-full bg-primary-foreground animate-pulse [animation-delay:150ms]" />
                      <span className="size-2 rounded-full bg-primary-foreground animate-pulse [animation-delay:300ms]" />
                    </div>
                    <p className="text-sm font-semibold opacity-80">Question</p>
                    <p className="mt-8 text-2xl font-bold leading-tight break-words">{selectedCard?.front || "No question provided."}</p>
                    <p className="mt-10 text-sm opacity-80">Tap to reveal answer</p>
                  </div>
                  <div className="study-card-face absolute inset-0 rotate-y-180 overflow-y-auto rounded-md border border-border bg-study-back p-6 text-primary-foreground shadow-soft custom-scrollbar">
                    <div className="absolute -left-12 bottom-0 size-36 rounded-full border border-primary-foreground/20" />
                    <p className="text-sm font-semibold opacity-80">Answer</p>
                    <p className="mt-8 whitespace-pre-line text-2xl font-bold leading-tight break-words">{selectedCard?.back || "No answer provided."}</p>
                  </div>
                </div>
              </button>

              <div className="mt-5 grid grid-cols-2 gap-3 shrink-0">
                <button onClick={() => markStudy(false)} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-3 font-bold text-card-foreground transition hover:-translate-y-0.5 hover:border-warning hover:text-warning whitespace-nowrap">
                  <RotateCcw className="size-4 shrink-0" /> Review again
                </button>
                <button onClick={() => markStudy(true)} className="inline-flex items-center justify-center gap-2 rounded-md bg-success px-3 py-3 font-bold text-success-foreground transition hover:-translate-y-0.5 hover:shadow-card whitespace-nowrap">
                  <Check className="size-4 shrink-0" /> Know
                </button>
              </div>

              <div className="mt-5 rounded-md border border-border bg-surface-tinted p-4 shrink-0">
                <div className="flex items-center justify-between text-sm font-semibold text-secondary-foreground">
                  <span>Session progress</span>
                  <span>{sessionCount} / 18</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-card">
                  <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${(sessionCount / 18) * 100}%` }} />
                </div>
              </div>
            </section>
          </div>

          <footer className="mt-5 flex flex-col gap-3 rounded-md border border-border bg-card/85 p-4 text-sm text-muted-foreground shadow-card backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2"><Tags className="size-4 text-primary shrink-0" /> Tags: <span className="truncate max-w-40">{selectedCard?.tag ?? "new"}</span>, {selectedCard?.template?.toLowerCase() ?? "template"}</span>
              <button onClick={() => setAutosaveText("Saved manually")} className="inline-flex items-center gap-2 hover:text-primary"><Save className="size-4 text-success shrink-0" /> Reliable auto-save enabled</button>
            </div>
            <span className="truncate">Designed for keyboard navigation and low cognitive load.</span>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default Index;
