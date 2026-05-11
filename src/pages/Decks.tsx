import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronRight,
  Trash2,
  Type,
  Italic,
  List,
  Sigma,
  ImagePlus,
  Volume2,
  MoreVertical,
  Copy,
  FolderInput,
  Library,
  Clock,
  Move,
  Play,
  ArrowLeft,
  Edit2,
  Bold,
  Heading1,
  Tag,
} from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { DeckSidebar } from "../components/decks/DeckSidebar";
import { CardList } from "../components/decks/CardList";
import { FlashcardEditor } from "../components/decks/FlashcardEditor";

// Components moved to separate files

const Decks = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<(Deck & { progress?: number })[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cardSearchTerm, setCardSearchTerm] = useState("");
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
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);

  // Autosave references to fix debounce and flush on unmount
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ id: string; updates: Partial<Card> } | null>(
    null,
  );
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require dragging 8px before activation to allow clicking
      },
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const targetDeckId = over.id as string;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.deck_id === targetDeckId) return;

    try {
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, deck_id: targetDeckId } : c)),
      );
      await cardService.updateCard(cardId, { deck_id: targetDeckId });
      toast.success("Card moved successfully!");

      if (selectedCardId === cardId) {
        // Switch to the target deck if the moved card was selected
        setSelectedDeckId(targetDeckId);
      }
    } catch (e) {
      toast.error("Failed to move card");
    }
  };

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
        cardService
          .updateCard(pending.id, pending.updates)
          .catch(console.error);
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
        setDecks(fetchedDecks.map((d) => ({ ...d, progress: 0 })));
        setCards(fetchedCards);
        if (fetchedDecks.length > 0) {
          setSelectedDeckId(fetchedDecks[0].id);
          const firstCard = fetchedCards.find(
            (c) => c.deck_id === fetchedDecks[0].id,
          );
          if (firstCard) {
            setSelectedCardId(firstCard.id);
            setLocalFront(firstCard.front);
            setLocalBack(firstCard.back);
            setLocalTag(firstCard.tags?.[0] || "");
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

  // Handle incoming actions from other pages
  useEffect(() => {
    const state = (window.history.state as any)?.usr;
    if (!state) return;
    if (state?.action === "new-deck") {
      addDeck();
      // Clear state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    } else if (state?.deckId) {
      handleSelectDeck(state.deckId);
      if (state.cardId) {
        const card = cards.find((c) => c.id === state.cardId);
        if (card) handleSelectCard(card);
      }
      window.history.replaceState({}, document.title);
    }
  }, [decks, cards]); // Trigger when data is loaded

  const deckCards = useMemo(() => {
    let filtered = cards.filter((c) => c.deck_id === selectedDeckId);
    if (cardSearchTerm) {
      const low = cardSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.front.toLowerCase().includes(low) ||
          c.back.toLowerCase().includes(low) ||
          c.tags?.some((t) => t.toLowerCase().includes(low)),
      );
    }
    return filtered;
  }, [cards, selectedDeckId, cardSearchTerm]);

  const filteredDecks = useMemo(
    () =>
      decks.filter((d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [decks, searchTerm],
  );
const handleSelectDeck = useCallback(
    (deckId: string | null) => {
      if (!deckId) {
        setSelectedDeckId(null);
        setSelectedCardId(null);
        setLocalFront("");
        setLocalBack("");
        setShowSafety(false);
        return;
      }
      setSelectedDeckId(deckId);
      const firstCard = cards.find((c) => c.deck_id === deckId);
      if (firstCard) {
        setSelectedCardId(firstCard.id);
        setLocalFront(firstCard.front);
        setLocalBack(firstCard.back);
        setLocalTag(firstCard.tags?.[0] || "");
      } else {
        setSelectedCardId(null);
        setLocalFront("");
        setLocalBack("");
        setLocalTag("");
      }
      setShowSafety(false);
      setShowMoveDialog(false);
    },
    [cards],
  );

  const handleSelectCard = useCallback(
    (card: Card) => {
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
      setLocalTag(card.tags?.[0] || "");

      // Sync DOM directly once when card changes
      setTimeout(() => {
        if (editorRef.current)
          editorRef.current.innerHTML =
            activeSide === "front" ? card.front : card.back;
      }, 0);
      setShowSafety(false);
      setShowMoveDialog(false);
    },
    [activeSide],
  );

  const handleUpdateContent = (updates: {
    front?: string;
    back?: string;
    tag?: string;
  }) => {
    if (!selectedCardId) return;

    if (updates.front !== undefined) setLocalFront(updates.front);
    if (updates.back !== undefined) setLocalBack(updates.back);
    if (updates.tag !== undefined) setLocalTag(updates.tag);

    setAutosaveText("Saving...");
    // Update local cards list
    setCards((prev) =>
      prev.map((c) => (c.id === selectedCardId ? { ...c, ...updates } : c)),
    );

    // Calculate final update payload
    const currentCard = cards.find((c) => c.id === selectedCardId);
    const fullUpdates = {
      front:
        updates.front !== undefined ? updates.front : currentCard?.front || "",
      back: updates.back !== undefined ? updates.back : currentCard?.back || "",
      tags: updates.tag !== undefined ? [updates.tag] : currentCard?.tags || [],
    };

    pendingSaveRef.current = {
      id: selectedCardId,
      updates: fullUpdates as Partial<Card>,
    };

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

  const handleEditorAction = (action: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    switch (action) {
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "list":
        document.execCommand("insertUnorderedList");
        break;
      case "header": {
        const isH1 = document.queryCommandValue("formatBlock") === "h1";
        document.execCommand("formatBlock", false, isH1 ? "p" : "h1");
        break;
      }
      case "math": {
        const math = window.prompt("Enter LaTeX math:", "e = mc^2");
        if (math)
          document.execCommand(
            "insertHTML",
            false,
            `<span class="math-tex text-orange-500 font-bold">$$ ${math} $$</span>`,
          );
        break;
      }
      case "image-upload":
        triggerFileAction("image");
        return;
      case "tts": {
        const selection = window.getSelection();
        const text = selection?.toString() || editor.innerText;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    handleUpdateContent({ [activeSide]: editor.innerHTML });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      const imgHtml = `<img src="${dataUrl}" class="max-w-full max-h-[250px] rounded-xl shadow-md my-4 mx-auto block" />`;
      document.execCommand("insertHTML", false, imgHtml);

      handleUpdateContent({ [activeSide]: editor.innerHTML });

      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const triggerFileAction = (action: string) => {
    setActiveAction(action);
    fileInputRef.current?.click();
  };

  const addCard = async (targetDeckId?: string) => {
    if (!user) return;
    const deckId = targetDeckId || selectedDeckId;
    if (!deckId) {
      setShowAddCardDialog(true);
      return;
    }

    setAutosaveText("Creating...");
    try {
      const newCard = await cardService.createCard({
        deck_id: deckId,
        user_id: user.id,
        template: "Q&A",
        front: "",
        back: "",
        tags: ["new"],
        next_review: Date.now(),
        interval: 0,
        ease: 2.5,
      });
      setCards((prev) => [...prev, newCard]);
      if (deckId !== selectedDeckId) {
        setSelectedDeckId(deckId);
      }
      handleSelectCard(newCard);
      toast.success("Card created successfully!");
      setAutosaveText("Created");
      setShowAddCardDialog(false);
    } catch (e: any) {
      console.error("Add card failed:", e);
      setAutosaveText("Error: " + (e.message || "Unknown error"));
    }
  };

  const deleteCard = async (id: string) => {
    if (!confirm(t("common.confirmDeleteCard"))) return;
    try {
      await cardService.deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedCardId === id) {
        setSelectedCardId(null);
        setLocalFront("");
        setLocalBack("");
      }
      toast.success(t("common.cardDeleted"));
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete card");
    }
  };

  const duplicateCard = async () => {
    if (!user || !selectedCardId || !selectedDeckId) return;
    const currentCard = cards.find((c) => c.id === selectedCardId);
    if (!currentCard) return;
    setAutosaveText("Duplicating...");
    try {
      const newCard = await cardService.createCard({
        deck_id: selectedDeckId,
        user_id: user.id,
        template: currentCard.template,
        front: currentCard.front,
        back: currentCard.back,
        tags: currentCard.tags || [],
        next_review: Date.now(),
        interval: 0,
        ease: currentCard.ease || 2.5,
      });
      setCards((prev) => [...prev, newCard]);
      handleSelectCard(newCard);
      toast.success(t("common.cardDuplicated"));
      setAutosaveText("Created");
    } catch (e) {
      setAutosaveText("Error duplicating");
    }
  };

  const moveCard = async (targetDeckId: string) => {
    if (!selectedCardId || !targetDeckId || targetDeckId === selectedDeckId)
      return;
    try {
      await cardService.updateCard(selectedCardId, { deck_id: targetDeckId });
      const updated = cards.map((c) =>
        c.id === selectedCardId ? { ...c, deck_id: targetDeckId } : c,
      );
      setCards(updated);
      const nextCard = updated.find((c) => c.deck_id === selectedDeckId);
      if (nextCard) handleSelectCard(nextCard);
      else handleSelectDeck(selectedDeckId);
      setShowMoveDialog(false);
    } catch (e) {
      console.error("Error moving card");
    }
  };

  const addDeck = useCallback(async () => {
    if (!user) return;
    const finalName =
      newDeckName.trim() || t("common.newDeck") || "Untitled Deck";
    try {
      const newDeck = await deckService.createDeck(
        user.id,
        finalName,
        "bg-primary",
      );
      setDecks((prev) => [...prev, { ...newDeck, progress: 0 }]);
      setSelectedDeckId(newDeck.id);
      setIsCreatingDeck(false);
      setNewDeckName("");

      // Auto-create the first card
      await addCard(newDeck.id);
      toast.success("New deck ready!");
    } catch (e) {
      toast.error("Error creating deck");
    }
  }, [user, newDeckName, t]);

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
    setDecks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: newName } : d)),
    );
    try {
      await deckService.updateDeck(id, { name: newName });
      toast.success(t("common.deckRenamed"));
    } catch (e) {
      console.error("Error renaming deck", e);
    }
  };

  const confirmDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t("common.confirmDeleteDeck"))) return;
    try {
      await deckService.deleteDeck(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      if (selectedDeckId === deckId) {
        handleSelectDeck(decks.find((d) => d.id !== deckId)?.id || null);
      }
      toast.success(t("common.deckDeleted"));
    } catch (e) {
      console.error("Error deleting deck", e);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCardId) return;
    try {
      await cardService.deleteCard(selectedCardId);
      const updated = cards.filter((c) => c.id !== selectedCardId);
      setCards(updated);
      const next = updated.find((c) => c.deck_id === selectedDeckId);
      if (next) handleSelectCard(next);
      else {
        setSelectedCardId(null);
        setLocalFront("");
        setLocalBack("");
        setLocalTag("");
      }
      setShowSafety(false);
      toast.success("Card deleted successfully!");
      setAutosaveText("Deleted");
    } catch (e) {
      setAutosaveText("Error deleting");
    }
  };

  if (isLoading)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );

  return (
    <Layout>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-160px)] animate-fade-in">
        {/* Left Sidebar - Decks List */}
        <DeckSidebar
          filteredDecks={filteredDecks}
          selectedDeckId={selectedDeckId}
          onSelectDeck={handleSelectDeck}
          isCreatingDeck={isCreatingDeck}
          setIsCreatingDeck={setIsCreatingDeck}
          newDeckName={newDeckName}
          setNewDeckName={setNewDeckName}
          onAddDeck={addDeck}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          editingDeckId={editingDeckId}
          editingDeckName={editingDeckName}
          setEditingDeckName={setEditingDeckName}
          onSaveDeckName={saveDeckName}
          onStartEditingDeck={startEditingDeck}
          onConfirmDeleteDeck={confirmDeleteDeck}
          getCardCount={(id) => cards.filter((c) => c.deck_id === id).length}
          t={t}
          decks={[]} // Unused for now
        />

        <main
          className={cn(
            "flex-1 min-w-0 flex flex-col gap-6 lg:overflow-hidden transition-all duration-300",
            !selectedDeckId && "hidden lg:flex",
          )}
        >
          {selectedDeckId ? (
            <>
              <div className="flex items-center justify-between bg-card p-4 rounded-3xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedDeckId(null)}
                    className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="size-5" />
                  </button>
                  <div>
                    <h3 className="text-lg font-black truncate max-w-[200px] sm:max-w-none">
                      {decks.find((d) => d.id === selectedDeckId)?.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {
                          cards.filter((c) => c.deck_id === selectedDeckId)
                            .length
                        }{" "}
                        {t("library.cards")}
                      </p>
                      <span className="text-muted-foreground/30">•</span>
                      <div className="flex items-center gap-1">
                        <Tag className="size-3 text-primary/50" />
                        <input
                          type="text"
                          placeholder="Deck tags..."
                          value={
                            decks
                              .find((d) => d.id === selectedDeckId)
                              ?.tags?.join(", ") || ""
                          }
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((t) => t.trim());
                            setDecks((prev) =>
                              prev.map((d) =>
                                d.id === selectedDeckId ? { ...d, tags } : d,
                              ),
                            );
                            deckService.updateDeck(selectedDeckId, { tags });
                          }}
                          className="bg-transparent text-[10px] font-bold text-primary outline-none placeholder:font-normal placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addCard()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-2xl font-black text-xs hover:bg-secondary/80 transition-all"
                  >
                    <Plus className="size-4" /> {t("common.add")}
                  </button>
                  <button
                    onClick={() => navigate(`/study?deck=${selectedDeckId}`)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                  >
                    <Play className="size-4 fill-current" /> {t("nav.study")}
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 lg:overflow-hidden min-h-0">
                <FlashcardEditor
                  activeSide={activeSide}
                  setActiveSide={setActiveSide}
                  localFront={localFront}
                  localBack={localBack}
                  localTag={localTag}
                  handleUpdateContent={handleUpdateContent}
                  handleEditorAction={handleEditorAction}
                  editorRef={editorRef}
                  autosaveText={autosaveText}
                  selectedCardId={selectedCardId}
                  onDuplicateCard={duplicateCard}
                  onAddCard={() => addCard()}
                  t={t}
                />

                <CardList
                  cards={deckCards}
                  selectedCardId={selectedCardId}
                  onSelectCard={handleSelectCard}
                  cardSearchTerm={cardSearchTerm}
                  setCardSearchTerm={setCardSearchTerm}
                  onDeleteCard={deleteCard}
                  t={t}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center bg-card/30 border border-dashed border-border rounded-[3rem] p-12 text-center">
              <div className="max-w-xs">
                <Library className="size-16 mx-auto text-primary/20 mb-6" />
                <h3 className="text-2xl font-black mb-2">
                  {t("library.noDecks")}
                </h3>
                <p className="text-muted-foreground font-medium mb-8">
                  Select a deck from the sidebar or create a new one to start
                  building your knowledge base.
                </p>
                <button
                  onClick={addDeck}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {t("common.newDeck")}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Hidden File Input for Image Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
      </DndContext>
    </Layout>
  );
};

export default Decks;
