import React from "react";
import { Search, Plus, Trash2, ChevronRight, Move, ImagePlus, Volume2, Sigma } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/services/cardService";

interface DraggableCardItemProps {
  card: Card;
  isSelected: boolean;
  onClick: () => void;
  t: (key: string) => string;
  onDelete: (id: string) => void;
}

const DraggableCardItem = ({
  card,
  isSelected,
  onClick,
  t,
  onDelete,
}: DraggableCardItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { type: "card", card },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative transition-all", isDragging && "opacity-50")}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-full group relative p-5 rounded-2xl border text-left transition-all flex flex-col justify-between overflow-hidden",
          isSelected
            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md scale-[1.01]"
            : "border-border bg-card/50 hover:border-primary/40 hover:bg-card hover:shadow-lg",
        )}
      >
        <div
          {...listeners}
          {...attributes}
          className="absolute top-2 right-2 p-1 text-muted-foreground/30 cursor-grab active:cursor-grabbing hover:text-primary transition-colors z-20"
        >
          <Move className="size-4" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
            {t("editor.front")}
          </p>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <p
              className={cn(
                "font-bold text-sm truncate pr-6",
                isSelected ? "text-primary" : "text-foreground",
              )}
            >
              {card.front.replace(/<[^>]*>/g, "").slice(0, 40) || "Empty Card"}
            </p>
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <div className="flex gap-2 items-center">
            {card.front.includes("![image]") ||
            card.back.includes("![image]") ? (
              <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
                <ImagePlus className="size-3.5" />
              </div>
            ) : null}
            {card.front.includes("[audio]") ||
            card.back.includes("[audio]") ? (
              <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-500">
                <Volume2 className="size-3.5" />
              </div>
            ) : null}
            {card.front.includes("$$") ? (
              <div className="p-1.5 rounded-lg bg-orange-500/5 text-orange-500">
                <Sigma className="size-3.5" />
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
            <ChevronRight
              className={cn(
                "size-5 text-muted-foreground group-hover:text-primary transition-transform duration-300",
                isSelected
                  ? "translate-x-0"
                  : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0",
              )}
            />
          </div>
        </div>
      </button>
    </div>
  );
};

interface CardListProps {
  cards: Card[];
  selectedCardId: string | null;
  onSelectCard: (card: Card) => void;
  cardSearchTerm: string;
  setCardSearchTerm: (v: string) => void;
  onDeleteCard: (id: string) => void;
  t: (key: string) => string;
}

export const CardList = ({
  cards,
  selectedCardId,
  onSelectCard,
  cardSearchTerm,
  setCardSearchTerm,
  onDeleteCard,
  t,
}: CardListProps) => {
  return (
    <div className="w-full lg:w-96 bg-card border border-border rounded-[2.5rem] p-6 shadow-sm flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          {t("dashboard.upcoming")} ({cards.length})
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
        {cards.map((c) => (
          <DraggableCardItem
            key={c.id}
            card={c}
            isSelected={selectedCardId === c.id}
            onClick={() => onSelectCard(c)}
            t={t}
            onDelete={onDeleteCard}
          />
        ))}
        {!cards.length && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-secondary/5 rounded-3xl border-2 border-dashed border-border/30">
            <Plus className="size-10 text-muted-foreground/20 mb-4" />
            <p className="text-sm font-bold text-muted-foreground">
              {t("editor.empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
