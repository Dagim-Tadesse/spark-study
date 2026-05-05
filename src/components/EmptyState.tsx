import { Button } from "@/components/ui/button";
import { FolderOpen, Layers, Plus } from "lucide-react";

interface EmptyStateProps {
  type?: "decks" | "cards";
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ type = "decks", title, description, actionLabel, onAction }: EmptyStateProps) => {
  const isDecks = type === "decks";
  const heading = title ?? (isDecks ? "No decks yet" : "No cards in this deck");
  const body =
    description ??
    (isDecks
      ? "Create your first deck to start building your flashcard collection."
      : "Add cards to this deck to begin studying.");
  const cta = actionLabel ?? (isDecks ? "Create Deck" : "Add Card");

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {isDecks ? (
          <FolderOpen className="size-10 text-muted-foreground" />
        ) : (
          <Layers className="size-10 text-muted-foreground" />
        )}
      </div>
      <h3 className="mt-6 text-xl font-bold text-foreground">{heading}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {onAction && (
        <Button onClick={onAction} className="mt-6">
          <Plus className="mr-2 size-4" />
          {cta}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
