import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  Trash2,
  Type,
  Italic,
  List,
  Sigma,
  Image,
  Volume2,
  LayoutGrid,
  BookOpen,
  MoreVertical,
  Edit2,
  Copy,
  FolderInput
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import Layout from "../components/Layout";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const editorTools = [
  { icon: Type, action: "type", label: "Key term" },
  { icon: Italic, action: "italic", label: "Emphasis" },
  { icon: List, action: "list", label: "List" },
  { icon: Sigma, action: "equation", label: "Equation" },
  { icon: Image, action: "image", label: "Image cue" },
  { icon: Volume2, action: "audio", label: "Audio cue" },
];

const Decks = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<(Deck & { progress?: number })[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [autosaveText, setAutosaveText] = useState("Up to date");
  const [showSafety, setShowSafety] = useState(false);

  // Deck editing state
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editingDeckName, setEditingDeckName] = useState("");

  // Local state for immediate typing feedback
  const [localFront, setLocalFront] = useState("");
  const [localBack, setLocalBack] = useState("");
  const [localTag, setLocalTag] = useState("");
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // Autosave references to fix debounce and flush on unmount
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ id: string; updates: Partial<Card> } | null>(null);

  // Handle beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingSaveRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        const pending = pendingSaveRef.current;
        cardService.updateCard(pending.id, pending.updates).catch(console.error);
        pendingSaveRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedDecks, fetchedCards] = await Promise.all([
          deckService.getDecks(user.id),
          cardService.getCards(user.id),
        ]);
        setDecks(fetchedDecks.map(d => ({ ...d, progress: 0 })));
        setCards(fetchedCards);
        if (fetchedDecks.length > 0) {
          setSelectedDeckId(fetchedDecks[0].id);
          const firstCard = fetchedCards.find(c => c.deck_id === fetchedDecks[0].id);
          if (firstCard) {
            setSelectedCardId(firstCard.id);
            setLocalFront(firstCard.front);
            setLocalBack(firstCard.back);
            setLocalTag(firstCard.tag || "");
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const deckCards = useMemo(() => cards.filter(c => c.deck_id === selectedDeckId), [cards, selectedDeckId]);
  const filteredDecks = useMemo(() => decks.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())), [decks, searchTerm]);

  const handleSelectDeck = (deckId: string | null) => {
    if (!deckId) {
      setSelectedDeckId(null);
      setSelectedCardId(null);
      setLocalFront("");
      setLocalBack("");
      setShowSafety(false);
      return;
    }
    setSelectedDeckId(deckId);
    const firstCard = cards.find(c => c.deck_id === deckId);
    if (firstCard) {
      setSelectedCardId(firstCard.id);
      setLocalFront(firstCard.front);
      setLocalBack(firstCard.back);
      setLocalTag(firstCard.tag || "");
    } else {
      setSelectedCardId(null);
      setLocalFront("");
      setLocalBack("");
      setLocalTag("");
    }
    setShowSafety(false);
    setShowMoveDialog(false);
  };

  const handleSelectCard = (card: Card) => {
    if (pendingSaveRef.current && pendingSaveRef.current.id !== card.id) {
      // Flush previous save before switching if switching cards rapidly
      const pending = pendingSaveRef.current;
      cardService.updateCard(pending.id, pending.updates).catch(console.error);
      pendingSaveRef.current = null;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setSelectedCardId(card.id);
    setLocalFront(card.front);
    setLocalBack(card.back);
    setLocalTag(card.tag || "");
    setShowSafety(false);
    setShowMoveDialog(false);
  };

  const handleUpdateContent = (updates: { front?: string; back?: string; tag?: string }) => {
    if (!selectedCardId) return;

    if (updates.front !== undefined) setLocalFront(updates.front);
    if (updates.back !== undefined) setLocalBack(updates.back);
    if (updates.tag !== undefined) setLocalTag(updates.tag);

    setAutosaveText("Saving...");
    // Update local cards list
    setCards(prev => prev.map(c => c.id === selectedCardId ? { ...c, ...updates } : c));

    // Calculate final update payload from the current known state + updates
    const currentCard = cards.find(c => c.id === selectedCardId);
    const fullUpdates = {
      front: updates.front !== undefined ? updates.front : (currentCard?.front || ""),
      back: updates.back !== undefined ? updates.back : (currentCard?.back || ""),
      tag: updates.tag !== undefined ? updates.tag : (currentCard?.tag || ""),
    };

    pendingSaveRef.current = { id: selectedCardId, updates: fullUpdates };
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Properly debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      try {
        await cardService.updateCard(pending.id, pending.updates);
        if (pendingSaveRef.current?.id === pending.id) {
          setAutosaveText("Saved");
          pendingSaveRef.current = null;
        }
      } catch (e) {
        setAutosaveText("Sync error");
      }
    }, 1000);
  };

  const addCard = async () => {
    if (!user || !selectedDeckId) return;
    setAutosaveText("Creating...");
    try {
      const newCard = await cardService.createCard({
        deck_id: selectedDeckId,
        user_id: user.id,
        template: "Q&A",
        front: "",
        back: "",
        tag: "new",
        next_review: Date.now(),
        interval: 0,
      });
      setCards(prev => [...prev, newCard]);
      handleSelectCard(newCard);
      setAutosaveText("Created");
    } catch (e) {
      setAutosaveText("Error");
    }
  };

  const duplicateCard = async () => {
    if (!user || !selectedCardId || !selectedDeckId) return;
    const currentCard = cards.find(c => c.id === selectedCardId);
    if (!currentCard) return;
    setAutosaveText("Duplicating...");
    try {
      const newCard = await cardService.createCard({
        deck_id: selectedDeckId,
        user_id: user.id,
        template: currentCard.template,
        front: currentCard.front,
        back: currentCard.back,
        tag: currentCard.tag,
        next_review: Date.now(),
        interval: 0,
      });
      setCards(prev => [...prev, newCard]);
      handleSelectCard(newCard);
      setAutosaveText("Created");
    } catch (e) {
      setAutosaveText("Error duplicating");
    }
  };

  const moveCard = async (targetDeckId: string) => {
    if (!selectedCardId || !targetDeckId || targetDeckId === selectedDeckId) return;
    try {
      await cardService.updateCard(selectedCardId, { deck_id: targetDeckId });
      const updated = cards.map(c => c.id === selectedCardId ? { ...c, deck_id: targetDeckId } : c);
      setCards(updated);
      const nextCard = updated.find(c => c.deck_id === selectedDeckId);
      if (nextCard) handleSelectCard(nextCard);
      else handleSelectDeck(selectedDeckId);
      setShowMoveDialog(false);
    } catch (e) {
      console.error("Error moving card");
    }
  };

  const addDeck = async () => {
    if (!user) return;
    try {
      const newDeck = await deckService.createDeck(user.id, `New Deck ${decks.length + 1}`, "bg-primary");
      setDecks(prev => [...prev, { ...newDeck, progress: 0 }]);
      handleSelectDeck(newDeck.id);
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingDeck = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDeckId(deck.id);
    setEditingDeckName(deck.name);
  };

  const saveDeckName = async () => {
    if (!editingDeckId || !editingDeckName.trim()) {
      setEditingDeckId(null);
      return;
    }
    const id = editingDeckId;
    const newName = editingDeckName.trim();
    setEditingDeckId(null);
    setDecks(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
    try {
      await deckService.updateDeck(id, { name: newName });
    } catch (e) {
      console.error("Error renaming deck", e);
    }
  };

  const confirmDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this deck? All its cards will also be lost.")) return;
    try {
      await deckService.deleteDeck(deckId);
      setDecks(prev => prev.filter(d => d.id !== deckId));
      if (selectedDeckId === deckId) {
        handleSelectDeck(decks.find(d => d.id !== deckId)?.id || null);
      }
    } catch (e) {
      console.error("Error deleting deck", e);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCardId) return;
    try {
      await cardService.deleteCard(selectedCardId);
      const updated = cards.filter(c => c.id !== selectedCardId);
      setCards(updated);
      const next = updated.find(c => c.deck_id === selectedDeckId);
      if (next) handleSelectCard(next);
      else {
        setSelectedCardId(null);
        setLocalFront("");
        setLocalBack("");
        setLocalTag("");
      }
      setShowSafety(false);
      setAutosaveText("Deleted");
    } catch (e) {
      setAutosaveText("Error deleting");
    }
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-160px)]">
        <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4 lg:overflow-y-auto lg:pr-2 custom-scrollbar">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><LayoutGrid className="size-5 text-primary" /> Library</h2>
            <button onClick={addDeck} aria-label="Add deck" className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-soft"><Plus className="size-4" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text" placeholder="Search decks..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            {filteredDecks.map(deck => (
              <div key={deck.id} className="relative group">
                <button
                  onClick={() => handleSelectDeck(deck.id)}
                  className={cn("w-full text-left p-3 rounded-xl border transition-all", selectedDeckId === deck.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30")}
                >
                  {editingDeckId === deck.id ? (
                    <input
                      autoFocus type="text" value={editingDeckName}
                      onChange={(e) => setEditingDeckName(e.target.value)}
                      onBlur={saveDeckName}
                      onKeyDown={(e) => e.key === 'Enter' && saveDeckName()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-background border border-primary rounded px-2 py-1 text-sm font-bold outline-none"
                    />
                  ) : (
                    <p className="font-bold text-sm truncate pr-6">{deck.name}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground uppercase font-black mt-1">{cards.filter(c => c.deck_id === deck.id).length} Cards</p>
                </button>

                <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 transition-opacity", selectedDeckId === deck.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button onClick={(e) => e.stopPropagation()} aria-label="Deck actions" className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => startEditingDeck(deck, e as any)}>
                        <Edit2 className="size-4 mr-2" /> Rename Deck
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => confirmDeleteDeck(deck.id, e as any)}>
                        <Trash2 className="size-4 mr-2" /> Delete Deck
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0 flex flex-col gap-4 lg:overflow-hidden">
          {selectedDeckId ? (
            <>
              <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border shadow-sm">
                <h3 className="text-base font-bold truncate">{decks.find(d => d.id === selectedDeckId)?.name}</h3>
                <button onClick={addCard} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-soft hover:-translate-y-0.5 transition">
                  <Plus className="size-4" /> Add Card
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4 lg:overflow-hidden min-h-0">
                {/* EDITOR */}
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm min-w-0 min-h-0 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Editor</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-success uppercase tracking-wider pr-1">{autosaveText}</span>
                      {selectedCardId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button aria-label="Card actions" className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                              <MoreVertical className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={duplicateCard}><Copy className="size-4 mr-2" /> Duplicate Card</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setShowMoveDialog(true); setShowSafety(false); }}><FolderInput className="size-4 mr-2" /> Move to Deck...</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { setShowSafety(true); setShowMoveDialog(false); }}><Trash2 className="size-4 mr-2" /> Delete Card</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {showSafety && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold">Delete this card?</span>
                      <div className="flex gap-2">
                        <button onClick={confirmDelete} className="px-3 py-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-md">Yes, Delete</button>
                        <button onClick={() => setShowSafety(false)} className="px-3 py-1.5 bg-secondary text-foreground text-[10px] font-bold rounded-md">Cancel</button>
                      </div>
                    </div>
                  )}

                  {showMoveDialog && (
                    <div className="p-3 bg-secondary/30 border border-border rounded-lg flex flex-col gap-2">
                      <span className="text-xs font-bold mb-1">Move card to deck:</span>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {decks.filter(d => d.id !== selectedDeckId).map(deck => (
                          <button key={deck.id} onClick={() => moveCard(deck.id)} className="px-3 py-1.5 bg-card border border-border hover:border-primary text-xs font-bold rounded-md transition-colors">{deck.name}</button>
                        ))}
                        {decks.filter(d => d.id !== selectedDeckId).length === 0 && (<span className="text-xs text-muted-foreground">No other decks available.</span>)}
                      </div>
                      <div className="mt-1 flex justify-end">
                        <button onClick={() => setShowMoveDialog(false)} className="px-3 py-1.5 bg-secondary text-foreground text-[10px] font-bold rounded-md">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {editorTools.map(t => (
                      <button key={t.label} title={t.label} aria-label={t.label} className="p-2 rounded-md bg-secondary text-muted-foreground hover:text-primary hover:bg-secondary/80 transition"><t.icon className="size-4" /></button>
                    ))}
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Tags</label>
                      <input
                        type="text" value={localTag}
                        onChange={(e) => handleUpdateContent({ tag: e.target.value })}
                        disabled={!selectedCardId}
                        className="w-full p-2.5 rounded-lg bg-secondary/30 border border-border focus:border-primary outline-none text-sm"
                        placeholder="e.g. math, easy"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Front Side</label>
                      <textarea
                        value={localFront}
                        onChange={(e) => handleUpdateContent({ front: e.target.value })}
                        disabled={!selectedCardId}
                        rows={5}
                        className="w-full min-h-[120px] max-h-[40vh] p-3 rounded-lg bg-secondary/30 border border-border focus:border-primary outline-none resize-y text-sm leading-relaxed break-words whitespace-pre-wrap"
                        placeholder="Type the question here..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Back Side</label>
                      <textarea
                        value={localBack}
                        onChange={(e) => handleUpdateContent({ back: e.target.value })}
                        disabled={!selectedCardId}
                        rows={5}
                        className="w-full min-h-[120px] max-h-[40vh] p-3 rounded-lg bg-secondary/30 border border-border focus:border-primary outline-none resize-y text-sm leading-relaxed break-words whitespace-pre-wrap"
                        placeholder="Type the answer here..."
                      />
                    </div>
                  </div>
                </div>

                {/* PREVIEW + LIST */}
                <div className="flex flex-col gap-4 min-w-0 min-h-0 overflow-hidden">
                  <div className="bg-gradient-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Live preview</span>
                      {localTag && <span className="text-[10px] font-bold uppercase rounded bg-primary/10 text-primary px-2 py-0.5">{localTag}</span>}
                    </div>
                    <div className="mt-3 rounded-xl border border-border bg-card p-4 min-h-[140px]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Question</p>
                      <p className="mt-1 text-sm font-semibold whitespace-pre-wrap break-words">{localFront || "—"}</p>
                      <div className="mt-3 border-t border-dashed border-border pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-success">Answer</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{localBack || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col min-h-0 overflow-hidden flex-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3">Cards in deck ({deckCards.length})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                      {deckCards.map(c => (
                        <button
                          key={c.id} onClick={() => handleSelectCard(c)}
                          className={cn("p-3 rounded-lg border text-left transition-all", selectedCardId === c.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30")}
                        >
                          <p className="text-xs font-bold line-clamp-2 break-words">{c.front || "(Empty Card)"}</p>
                        </button>
                      ))}
                      {!deckCards.length && (
                        <p className="text-xs text-muted-foreground col-span-full">No cards yet. Click "Add Card" to start.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-3xl opacity-60">
              <BookOpen className="size-14 mb-4 text-primary" />
              <h3 className="text-lg font-bold">Select a deck to begin</h3>
              <p className="text-sm mt-2 text-muted-foreground">Or click + to create your first one.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default Decks;
