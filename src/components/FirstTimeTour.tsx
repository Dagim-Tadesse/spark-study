import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const FirstTimeTour = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;

  const finish = () => {
    try {
      localStorage.setItem("spark_seen_tour", "1");
    } catch (e) {
      void e;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] grid place-items-center bg-foreground/50 backdrop-blur-sm p-4"
      onClick={finish}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl border border-border"
      >
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="size-5 text-primary" />
          <h3 className="font-bold text-lg">Welcome to Spark Study</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          A quick tour to get you started — keyboard shortcuts, quick deck creation, and study flows.
        </p>
        <ol className="list-decimal ml-4 space-y-2 mb-6 text-sm">
          <li>Use the library to create decks and cards.</li>
          <li>Press SPACE to flip a card in Study mode.</li>
          <li>Use 1-4 to grade answers quickly.</li>
        </ol>
        <div className="flex justify-end">
          <button
            onClick={finish}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold"
          >
            Got it <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeTour;
