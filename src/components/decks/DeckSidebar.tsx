import React from "react";
import { Plus, Search, Library, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Deck } from "@/services/deckService";

interface DroppableDeckItemProps {
  deck: Deck;
  isSelected: boolean;
  onSelect: () => void;
  cardCount: number;
  onRename: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const DroppableDeckItem = ({
  deck,
  isSelected,
  onSelect,
  cardCount,
  onRename,
  onDelete,
}: DroppableDeckItemProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: deck.id,
    data: { type: "deck", deckId: deck.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative group transition-all rounded-2xl",
        isOver && "ring-2 ring-primary ring-offset-2 scale-[1.03] z-10",
      )}
    >
      <button
        onClick={onSelect}
        className={cn(
          "w-full text-left p-4 rounded-2xl border transition-all duration-300",
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50 hover:shadow-md",
        )}
      >
        <p className="font-bold text-sm truncate pr-6">{deck.name}</p>
        <p
          className={cn(
            "text-[10px] uppercase font-black mt-1",
            isSelected ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {cardCount} Cards
        </p>
      </button>

      <div
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isSelected
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
              onClick={onRename}
              className="rounded-xl font-bold p-3"
            >
              <Edit2 className="size-4 mr-3" /> Rename Deck
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive rounded-xl font-bold p-3"
              onClick={onDelete}
            >
              <Trash2 className="size-4 mr-3" /> Delete Deck
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

interface DeckSidebarProps {
  decks: (Deck & { progress?: number })[];
  filteredDecks: (Deck & { progress?: number })[];
  selectedDeckId: string | null;
  onSelectDeck: (id: string | null) => void;
  isCreatingDeck: boolean;
  setIsCreatingDeck: (v: boolean) => void;
  newDeckName: string;
  setNewDeckName: (v: string) => void;
  onAddDeck: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  editingDeckId: string | null;
  editingDeckName: string;
  setEditingDeckName: (v: string) => void;
  onSaveDeckName: () => void;
  onStartEditingDeck: (deck: Deck, e: React.MouseEvent) => void;
  onConfirmDeleteDeck: (id: string, e: React.MouseEvent) => void;
  getCardCount: (deckId: string) => number;
  t: (key: string) => string;
}

export const DeckSidebar = ({
  filteredDecks,
  selectedDeckId,
  onSelectDeck,
  isCreatingDeck,
  setIsCreatingDeck,
  newDeckName,
  setNewDeckName,
  onAddDeck,
  searchTerm,
  setSearchTerm,
  editingDeckId,
  editingDeckName,
  setEditingDeckName,
  onSaveDeckName,
  onStartEditingDeck,
  onConfirmDeleteDeck,
  getCardCount,
  t,
}: DeckSidebarProps) => {
  return (
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
            onKeyDown={(e) => e.key === "Enter" && onAddDeck()}
            className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={onAddDeck}
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
          <DroppableDeckItem
            key={deck.id}
            deck={deck}
            isSelected={selectedDeckId === deck.id}
            onSelect={() => onSelectDeck(deck.id)}
            cardCount={getCardCount(deck.id)}
            onRename={(e) => onStartEditingDeck(deck, e)}
            onDelete={(e) => onConfirmDeleteDeck(deck.id, e)}
          />
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
  );
};
