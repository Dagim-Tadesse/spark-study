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
  const heading = title ?? (isDecks ? "Start your learning journey" : "Your deck is empty");
  const body =
    description ??
    (isDecks
      ? "Create your first deck and master any subject with spaced repetition."
      : "Add some flashcards to start your study session.");
  const cta = actionLabel ?? (isDecks ? "Create Your First Deck" : "Add Your First Card");

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative group">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl group-hover:opacity-100 opacity-0 transition-opacity" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary border border-border shadow-soft group-hover:scale-105 transition-transform">
          {isDecks ? (
            <FolderOpen className="size-12 text-primary" />
          ) : (
            <Layers className="size-12 text-accent" />
          )}
        </div>
      </div>
      <h3 className="mt-8 text-2xl font-bold tracking-tight text-foreground">{heading}</h3>
      <p className="mt-2 max-w-sm text-base text-muted-foreground">{body}</p>
      {onAction && (
        <Button onClick={onAction} size="lg" className="mt-8 px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
          <Plus className="mr-2 size-5" />
          {cta}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
