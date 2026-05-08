import Layout from "../components/Layout";
import { Keyboard, Lightbulb, MousePointerClick, ShieldCheck, Eye, Languages, BookOpen } from "lucide-react";

const Help = () => {
  const steps = [
    { title: "Create a deck", text: "Go to Library → click + to create a new deck. Rename it from the ⋯ menu." },
    { title: "Add cards", text: "Pick a deck, click 'Add Card', and fill in the front (question) and back (answer). Saving happens automatically." },
    { title: "Tag for context", text: "Use short tags like 'math' or 'easy' to group related cards." },
    { title: "Study session", text: "Open Study, pick a deck, flip the card with a click or the F key, then mark Know or Review Again." },
    { title: "Recover mistakes", text: "Deleting a card is reversible — confirm in the inline dialog. Edits autosave so you can keep typing." },
  ];

  const shortcuts = [
    { k: "F", v: "Flip current card" },
    { k: "K / N", v: "Mark as Known / Next" },
    { k: "R", v: "Review again" },
    { k: "Esc", v: "End session" },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-primary">Help center</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold">How to use Micro-Learn</h2>
          <p className="text-muted-foreground">A quick walkthrough — under two minutes from sign-up to your first review.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <article key={s.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground font-black">
                  {i + 1}
                </span>
                <h3 className="font-bold">{s.title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 font-bold">
            <Keyboard className="size-5 text-primary" /> Keyboard shortcuts
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {shortcuts.map((s) => (
              <div key={s.k} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span>{s.v}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs font-bold">{s.k}</kbd>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-gradient-card p-6">
          <h3 className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-5 text-primary" /> Accessibility
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <li className="flex gap-3"><Eye className="size-4 text-primary mt-0.5" /> Color-blind safe palette + patterns toggle</li>
            <li className="flex gap-3"><Languages className="size-4 text-primary mt-0.5" /> English / Amharic UI language</li>
            <li className="flex gap-3"><Lightbulb className="size-4 text-primary mt-0.5" /> Larger text and reduced motion options</li>
            <li className="flex gap-3"><MousePointerClick className="size-4 text-primary mt-0.5" /> Full keyboard navigation + skip link</li>
            <li className="flex gap-3"><BookOpen className="size-4 text-primary mt-0.5" /> Screen-reader labels on every interactive element</li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Open the gear icon in the top bar to toggle these.</p>
        </section>
      </div>
    </Layout>
  );
};

export default Help;
