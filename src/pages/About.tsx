import Layout from "../components/Layout";
import { Github, Mail, Heart, Sparkles } from "lucide-react";

const About = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-primary">About the project</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Micro-Learn Flashcard Interface</h2>
          <p className="text-muted-foreground max-w-2xl">
            A focused, distraction-free flashcard studio designed around micro-sessions and long-term retention.
            Built for students who want to capture an idea today and remember it next month.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h3 className="font-bold text-lg">What it is</h3>
          <p className="text-sm text-muted-foreground">
            MLFI is a web app for creating, reviewing and managing flashcards. Cards live in decks; decks live in your
            account. Reviews are scheduled with a simple spaced-repetition rhythm so you never see everything at once.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h3 className="font-bold text-lg">Tech</h3>
          <p className="text-sm text-muted-foreground">
            React + Vite + TypeScript on the frontend, Tailwind for design tokens, and Supabase (Postgres + Auth + RLS)
            for storage and accounts. The schema lives in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">supabase/schema.sql</code>.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-4">The makers</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { name: "MLFI Team", role: "Design & engineering", initials: "MT" },
            ].map((m) => (
              <article key={m.name} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-black">
                  {m.initials}
                </div>
                <div>
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-gradient-card p-6">
          <h3 className="font-bold flex items-center gap-2"><Heart className="size-4 text-destructive" /> Get in touch</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <a href="mailto:hello@mlfi.app" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 hover:border-primary">
              <Mail className="size-4" /> hello@mlfi.app
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;
