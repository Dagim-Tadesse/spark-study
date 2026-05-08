import { useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MarkdownRenderer = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  // If content looks like HTML, render it as is
  if (content.includes("<") && content.includes(">")) {
    return (
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none w-full break-words",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const renderLine = (line: string, i: number) => {
    // Basic Markdown support for old cards
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch)
      return (
        <img
          key={i}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          className="max-w-full max-h-[300px] rounded-xl shadow-lg my-4 object-contain mx-auto"
        />
      );

    if (line.startsWith("# "))
      return (
        <h1
          key={i}
          className="text-2xl font-black border-b border-border/50 pb-2 mb-4 mt-6"
        >
          {line.slice(2)}
        </h1>
      );
    if (line.startsWith("- "))
      return (
        <li key={i} className="ml-4 list-disc">
          {line.slice(2)}
        </li>
      );

    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className={cn("leading-relaxed", className)}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-primary font-black">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="space-y-3 w-full py-2">
      {content.split("\n").map((line, i) => renderLine(line, i))}
    </div>
  );
};
import { useI18n } from "../contexts/I18nContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const editorTools = [
  { icon: Heading1, label: "Header", action: "header" },
  { icon: Italic, label: "Italic", action: "italic" },
  { icon: List, label: "List", action: "list" },
  { icon: Sigma, label: "Math", action: "math" },
  { icon: ImagePlus, label: "Image", action: "image-upload" },
  { icon: Volume2, label: "Speak", action: "tts" },
];

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
    if (state?.action === "new-deck") {
      addDeck();
      // Clear state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [decks]); // Trigger once decks are loaded so addDeck can name it correctly

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
    setLocalTag(card.tags?.[0] || "");

    // Sync DOM directly once when card changes
    setTimeout(() => {
      if (editorRef.current)
        editorRef.current.innerHTML =
          activeSide === "front" ? card.front : card.back;
    }, 0);
    setShowSafety(false);
    setShowMoveDialog(false);
  };

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
      updates: fullUpdates as any,
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
      case "header":
        const isH1 = document.queryCommandValue("formatBlock") === "h1";
        document.execCommand("formatBlock", false, isH1 ? "p" : "h1");
        break;
      case "math":
        const math = window.prompt("Enter LaTeX math:", "e = mc^2");
        if (math)
          document.execCommand(
            "insertHTML",
            false,
            `<span class="math-tex text-orange-500 font-bold">$$ ${math} $$</span>`,
          );
        break;
      case "image-upload":
        triggerFileAction("image");
        return;
      case "tts":
        const selection = window.getSelection();
        const text = selection?.toString() || editor.innerText;
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        return;
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

  const addDeck = async () => {
    if (!user) return;
    const finalName = newDeckName.trim() || t("common.newDeck") || "Untitled Deck";
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
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-160px)] animate-fade-in">
        {/* Left Sidebar - Decks List */}
        <aside
          className={cn(
            "w-full lg:w-72 shrink-0 flex flex-col gap-4 lg:overflow-y-auto lg:pr-2 custom-scrollbar transition-all duration-300",
            selectedDeckId && "hidden lg:flex",
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Library className="size-5 text-primary" /> {t("nav.library")}
            </h2>
            <button
              onClick={() => setIsCreatingDeck(true)}
              aria-label={t("common.newDeck")}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <Plus className="size-5" />
            </button>
          </div>

          {isCreatingDeck && (
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-3 animate-in slide-in-from-top-2">
              <input
                autoFocus
                type="text"
                placeholder="Deck name..."
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDeck()}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={addDeck}
                  className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-black"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreatingDeck(false)}
                  className="flex-1 bg-secondary py-2 rounded-xl text-xs font-black"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card/50 text-sm outline-none focus:bg-card focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            {filteredDecks.map((deck) => (
              <div key={deck.id} className="relative group">
                <button
                  onClick={() => handleSelectDeck(deck.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all duration-300",
                    selectedDeckId === deck.id
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                      : "border-border bg-card hover:border-primary/50 hover:shadow-md",
                  )}
                >
                  {editingDeckId === deck.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingDeckName}
                      onChange={(e) => setEditingDeckName(e.target.value)}
                      onBlur={saveDeckName}
                      onKeyDown={(e) => e.key === "Enter" && saveDeckName()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-background border border-primary rounded px-2 py-1 text-sm font-bold outline-none text-foreground"
                    />
                  ) : (
                    <p className="font-bold text-sm truncate pr-6">
                      {deck.name}
                    </p>
                  )}
                  <p
                    className={cn(
                      "text-[10px] uppercase font-black mt-1",
                      selectedDeckId === deck.id
                        ? "text-white/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {cards.filter((c) => c.deck_id === deck.id).length}{" "}
                    {t("library.cards")}
                  </p>
                </button>

                <div
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 transition-opacity",
                    selectedDeckId === deck.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          selectedDeckId === deck.id
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-secondary text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-2xl p-2 shadow-xl border-border"
                    >
                      <DropdownMenuItem
                        onClick={(e) => startEditingDeck(deck, e as any)}
                        className="rounded-xl font-bold p-3"
                      >
                        <Edit2 className="size-4 mr-3" /> Rename Deck
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive rounded-xl font-bold p-3"
                        onClick={(e) => confirmDeleteDeck(deck.id, e as any)}
                      >
                        <Trash2 className="size-4 mr-3" /> Delete Deck
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filteredDecks.length === 0 && (
              <div className="py-12 text-center bg-secondary/5 rounded-3xl border-2 border-dashed border-border/30">
                <Library className="size-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold text-muted-foreground">
                  {t("library.noDecks")}
                </p>
              </div>
            )}
          </div>
        </aside>

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
                {/* EDITOR SECTION */}
                <div className="flex-1 flex flex-col gap-4 bg-card border border-border rounded-[2.5rem] p-6 shadow-sm min-h-0 min-w-0">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl relative">
                      {/* Sliding Background Pill */}
                      <motion.div
                        layoutId="activeSideTab"
                        className="absolute inset-y-1 rounded-lg bg-background shadow-sm"
                        initial={false}
                        animate={{
                          left:
                            activeSide === "front" ? "4px" : "calc(50% + 2px)",
                          width: "calc(50% - 6px)",
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.4,
                        }}
                      />
                      <button
                        onClick={() => {
                          setActiveSide("front");
                          if (editorRef.current)
                            editorRef.current.innerHTML = localFront;
                        }}
                        className={cn(
                          "relative z-10 flex-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          activeSide === "front"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t("editor.front")}
                      </button>
                      <button
                        onClick={() => {
                          setActiveSide("back");
                          if (editorRef.current)
                            editorRef.current.innerHTML = localBack;
                        }}
                        className={cn(
                          "relative z-10 flex-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          activeSide === "back"
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t("editor.back")}
                      </button>
                    </div>

                    <div className="hidden sm:flex gap-1">
                      {editorTools.map((tool) => (
                        <button
                          key={tool.label}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleEditorAction(tool.action)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all group relative"
                          title={tool.label}
                        >
                          <tool.icon className="size-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 relative min-h-[300px] overflow-hidden">
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={(e) =>
                        handleUpdateContent({
                          [activeSide]: e.currentTarget.innerHTML,
                        })
                      }
                      className="w-full h-full overflow-y-auto bg-transparent py-4 text-lg font-medium outline-none placeholder:text-muted-foreground/30 leading-relaxed custom-scrollbar prose prose-sm dark:prose-invert max-w-none 
                        [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:text-primary
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                        [&_img]:rounded-2xl [&_img]:shadow-lg [&_img]:my-6"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {["Definition", "Formula", "Q&A", "Diagram"].map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              const tags = localTag.includes(tag) ? [] : [tag];
                              handleUpdateContent({ tag: tags[0] || "" });
                            }}
                            className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all border",
                              localTag === tag
                                ? "bg-primary text-white border-primary"
                                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50",
                            )}
                          >
                            {tag}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-xl border border-border/50">
                      <Tag className="size-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={localTag}
                        placeholder={t("common.addTag")}
                        onChange={(e) =>
                          handleUpdateContent({ tag: e.target.value })
                        }
                        className="bg-transparent text-xs font-bold outline-none flex-1 placeholder:font-normal"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-bold text-success uppercase tracking-wider">
                        {autosaveText}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={duplicateCard}
                        disabled={!selectedCardId}
                        className="p-2.5 rounded-xl hover:bg-secondary border border-border text-muted-foreground transition-all disabled:opacity-30"
                        title="Duplicate"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        onClick={() => addCard()}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-black text-sm hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                      >
                        <Plus className="size-4" /> {t("common.add")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CARD LIST SECTION */}
                <div className="w-full lg:w-96 bg-card border border-border rounded-[2.5rem] p-6 shadow-sm flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      {t("dashboard.upcoming")} ({deckCards.length})
                    </span>
                    <div className="relative flex-1 max-w-[180px]">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search card..."
                        value={cardSearchTerm}
                        onChange={(e) => setCardSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-2 py-2 text-xs bg-secondary/50 rounded-lg outline-none border border-transparent focus:border-primary/30 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
                    {deckCards.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCard(c)}
                        className={cn(
                          "w-full group relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between overflow-hidden",
                          selectedCardId === c.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md scale-[1.01]"
                            : "border-border bg-card/50 hover:border-primary/40 hover:bg-card hover:shadow-lg",
                        )}
                      >
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                            {t("editor.front")}
                          </p>
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-bold text-sm truncate",
                                selectedCardId === c.id
                                  ? "text-primary"
                                  : "text-foreground",
                              )}
                            >
                              {c.front.replace(/<[^>]*>/g, "").slice(0, 40) ||
                                "Empty Card"}
                            </p>
                            {c.tags && c.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {c.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                          <div className="flex gap-2 items-center">
                            {c.front.includes("![image]") ||
                            c.back.includes("![image]") ? (
                              <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                                <ImagePlus className="size-3.5" />
                              </div>
                            ) : null}
                            {c.front.includes("[audio]") ||
                            c.back.includes("[audio]") ? (
                              <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-500">
                                <Volume2 className="size-3.5" />
                              </div>
                            ) : null}
                            {c.front.includes("$$") ? (
                              <div className="p-1.5 rounded-lg bg-orange-500/5 text-orange-500">
                                <Sigma className="size-3.5" />
                              </div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCard(c.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                            <ChevronRight
                              className={cn(
                                "size-5 text-muted-foreground group-hover:text-primary transition-transform duration-300",
                                selectedCardId === c.id
                                  ? "translate-x-0"
                                  : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0",
                              )}
                            />
                          </div>
                        </div>
                      </button>
                    ))}
                    {!deckCards.length && (
                      <div className="py-20 flex flex-col items-center justify-center text-center bg-secondary/5 rounded-3xl border-2 border-dashed border-border/30">
                        <Plus className="size-10 text-muted-foreground/20 mb-4" />
                        <p className="text-sm font-bold text-muted-foreground">
                          {t("editor.empty")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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
    </Layout>
  );
};

export default Decks;
