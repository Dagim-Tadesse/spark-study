import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-6 text-center shadow-card">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}import { Button } from "@/components/ui/button";
import { FolderOpen, Layers, Plus } from "lucide-react";

interface EmptyStateProps {
  type: "decks" | "cards";
  onAction?: () => void;
}

const EmptyState = ({ type, onAction }: EmptyStateProps) => {
  const isDecks = type === "decks";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        {isDecks ? (
          <FolderOpen className="size-10 text-muted-foreground" />
        ) : (
          <Layers className="size-10 text-muted-foreground" />
        )}
      </div>
      <h3 className="mt-6 text-xl font-bold text-foreground">
        {isDecks ? "No decks yet" : "No cards in this deck"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {isDecks
          ? "Create your first deck to start building your flashcard collection."
          : "Add cards to this deck to begin studying."}
      </p>
      {onAction && (
        <Button onClick={onAction} className="mt-6">
          <Plus className="mr-2 size-4" />
          {isDecks ? "Create Deck" : "Add Card"}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
