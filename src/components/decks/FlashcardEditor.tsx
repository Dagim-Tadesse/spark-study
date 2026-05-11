import React, { useRef, useEffect } from "react";
import { Heading1, Italic, List, Sigma, ImagePlus, Volume2, Tag, Copy, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlashcardEditorProps {
  activeSide: "front" | "back";
  setActiveSide: (side: "front" | "back") => void;
  localFront: string;
  localBack: string;
  localTag: string;
  handleUpdateContent: (updates: { front?: string; back?: string; tag?: string }) => void;
  handleEditorAction: (action: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  autosaveText: string;
  selectedCardId: string | null;
  onDuplicateCard: () => void;
  onAddCard: () => void;
  t: (key: string) => string;
}

const editorTools = [
  { icon: Heading1, label: "Header", action: "header" },
  { icon: Italic, label: "Italic", action: "italic" },
  { icon: List, label: "List", action: "list" },
  { icon: Sigma, label: "Math", action: "math" },
  { icon: ImagePlus, label: "Image", action: "image-upload" },
  { icon: Volume2, label: "Speak", action: "tts" },
];

export const FlashcardEditor = ({
  activeSide,
  setActiveSide,
  localFront,
  localBack,
  localTag,
  handleUpdateContent,
  handleEditorAction,
  editorRef,
  autosaveText,
  selectedCardId,
  onDuplicateCard,
  onAddCard,
  t,
}: FlashcardEditorProps) => {
  return (
    <div className="flex-1 flex flex-col gap-4 bg-card border border-border rounded-[2.5rem] p-6 shadow-sm min-h-0 min-w-0">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl relative">
          {/* Sliding Background Pill */}
          <motion.div
            layoutId="activeSideTab"
            className="absolute inset-y-1 rounded-lg bg-background shadow-sm"
            initial={false}
            animate={{
              left: activeSide === "front" ? "4px" : "calc(50% + 2px)",
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
              if (editorRef.current) editorRef.current.innerHTML = localFront;
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
              if (editorRef.current) editorRef.current.innerHTML = localBack;
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
          {["Definition", "Formula", "Q&A", "Diagram"].map((tag) => (
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
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-xl border border-border/50">
          <Tag className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={localTag}
            placeholder={t("common.addTag")}
            onChange={(e) => handleUpdateContent({ tag: e.target.value })}
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
            onClick={onDuplicateCard}
            disabled={!selectedCardId}
            className="p-2.5 rounded-xl hover:bg-secondary border border-border text-muted-foreground transition-all disabled:opacity-30"
            title="Duplicate"
          >
            <Copy className="size-4" />
          </button>
          <button
            onClick={onAddCard}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-black text-sm hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="size-4" /> {t("common.add")}
          </button>
        </div>
      </div>
    </div>
  );
};
