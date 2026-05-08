import { Link } from "react-router-dom";
import {
  Brain,
  Sparkles,
  ShieldCheck,
  Zap,
  Target,
  Heart,
  Layers3,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Clock3,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const features = [
  { icon: Layers3, title: "Rich content cards", text: "Text, equations, lists, images and audio cues — all in one focused editor." },
  { icon: Wand2, title: "Smart templates", text: "Definition, Q&A, Formula and Diagram templates speed up card creation." },
  { icon: Brain, title: "Spaced study", text: "Flip cards, mark Know / Review again, and watch your retention grow." },
  { icon: ShieldCheck, title: "Safety first", text: "Auto-save, version history, undo and a 30-day recovery bin protect your work." },
  { icon: Clock3, title: "Daily streaks", text: "Lightweight stats and streaks keep micro-learning sessions consistent." },
  { icon: Sparkles, title: "Calm, focused UI", text: "Minimal layout, accessible contrast and motion that respects you." },
];

// (Removed HCI goals listing per design — focus on user-facing value, not principles.)

const Landing = () => {
  const { user } = useAuth();
  const ctaTo = user ? "/decks" : "/login";

  return (
    <main className="mlfi-shell min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[6%] top-20 size-72 rounded-full bg-primary/15 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[8%] size-80 rounded-full bg-accent/15 blur-3xl animate-drift-delayed" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">MLFI</p>
            <h1 className="font-display text-lg font-bold leading-none">Micro-Learn</h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to={ctaTo}
            className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
          >
            {user ? "Open studio" : "Get started"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-10 pb-20 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          {/* Left: copy */}
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur shadow-soft">
              <span className="size-1.5 rounded-full bg-success animate-pulse-save" />
              <Sparkles className="size-3.5" /> Micro-learning, calmly designed
            </span>
            <h2 className="mt-5 font-display text-[2.25rem] leading-[1.05] font-bold tracking-tight md:text-5xl lg:text-6xl">
              Learn in{" "}
              <span
                className="bg-clip-text text-transparent animate-gradient-x"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--study-back)), hsl(var(--primary)))",
                  backgroundSize: "300% 100%",
                }}
              >
                small bursts
              </span>
              .
              <br /> Remember for longer.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
              MLFI is a focused flashcard studio designed for maximum retention — calm, not chaotic.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ctaTo}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-md bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-focus"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                Start studying free
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card/80 px-5 py-3 text-sm font-bold text-foreground backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                Explore features
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {["No credit card", "Auto-save", "Keyboard friendly", "Dark mode"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-success" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: animated card stack */}
          <div className="relative h-[440px] md:h-[520px] animate-scale-in">
            <div className="absolute inset-0 -z-0">
              <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 bg-gradient-primary opacity-30 blur-3xl animate-blob" />
              <div className="absolute right-0 top-10 size-40 rounded-full bg-accent/30 blur-2xl animate-float-y" />
            </div>

            {/* Orbiting badges */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute animate-orbit">
                <div className="grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 shadow-card backdrop-blur">
                  <Brain className="size-4 text-primary" />
                </div>
              </div>
              <div className="absolute" style={{ animation: "orbit 18s linear infinite -6s" }}>
                <div className="grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 shadow-card backdrop-blur">
                  <Zap className="size-4 text-accent" />
                </div>
              </div>
              <div className="absolute" style={{ animation: "orbit 22s linear infinite -12s" }}>
                <div className="grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 shadow-card backdrop-blur">
                  <ShieldCheck className="size-4 text-success" />
                </div>
              </div>
            </div>

            {/* Back card */}
            <div className="absolute right-2 top-4 w-[78%] rotate-6 rounded-2xl border border-border bg-card/70 p-5 shadow-card backdrop-blur-xl animate-float-y-delayed">
              <span className="rounded-md bg-accent/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-accent-foreground">
                Math · Calculus
              </span>
              <p className="mt-3 font-display text-lg font-bold opacity-80">
                d/dx [sin(x)] = cos(x)
              </p>
            </div>

            {/* Middle card */}
            <div className="absolute left-2 top-24 w-[78%] -rotate-3 rounded-2xl border border-border bg-card/80 p-5 shadow-card backdrop-blur-xl animate-float-y">
              <span className="rounded-md bg-success/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-success">
                History · 1969
              </span>
              <p className="mt-3 font-display text-lg font-bold opacity-90">
                First moon landing — Apollo 11.
              </p>
            </div>

            {/* Front card (hero) */}
            <div className="absolute left-1/2 top-1/2 w-[88%] max-w-md -translate-x-1/2 -translate-y-1/2 animate-tilt">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-30 blur-2xl" />
              <div className="relative rounded-2xl border border-border bg-card/95 p-6 shadow-soft backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                    Biology · Cell
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                    <span className="size-1.5 rounded-full bg-success animate-pulse-save" /> Auto-saved
                  </span>
                </div>
                <p className="mt-5 font-display text-xl md:text-2xl font-bold leading-tight">
                  What process produces ATP in mitochondria?
                </p>
                <div className="mt-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold text-primary">Answer</p>
                  <p className="mt-1 text-foreground">
                    Oxidative phosphorylation — electron transport chain coupled with ATP synthase.
                  </p>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "Retention", v: "86%" },
                    { l: "Streak", v: "9d" },
                    { l: "Due", v: "18" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-md border border-border bg-surface-raised p-2">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.l}</p>
                      <p className="text-base font-bold text-foreground">{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-4 -left-6 hidden rounded-xl border border-border bg-card p-2.5 shadow-card md:block animate-float-y">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="grid size-7 place-items-center rounded-md bg-success text-success-foreground">
                    <CheckCircle2 className="size-4" />
                  </span>
                  Marked known
                </div>
              </div>
              <div className="absolute -top-5 -right-4 hidden rounded-xl border border-border bg-card px-3 py-2 shadow-card md:block animate-float-y-delayed">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Sparkles className="size-3.5 text-accent" /> +24 XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="relative mt-16 overflow-hidden rounded-2xl border border-border bg-card/60 py-4 backdrop-blur">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
          <div className="flex w-max animate-marquee gap-10 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {[...Array(2)].flatMap((_, i) =>
              ["Spaced repetition", "30-day recovery", "Equations & code", "Streak tracking", "Keyboard shortcuts", "Dark mode", "Auto-save", "Version history"].map((t) => (
                <span key={`${i}-${t}`} className="inline-flex items-center gap-2">
                  <Sparkles className="size-3 text-primary" /> {t}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card/85 p-7 shadow-card backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wider text-destructive">The problem</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Studying tools are noisy and fragile.</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Cluttered dashboards bury what matters today.</li>
              <li>• One wrong click deletes hours of work, with no recovery.</li>
              <li>• Editors lack support for equations, code or images.</li>
              <li>• No clear feedback on what to review next.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-border bg-gradient-card p-7 shadow-soft backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Our solution</p>
            <h3 className="mt-2 font-display text-2xl font-bold">A calm, tabbed studio for daily recall.</h3>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex gap-2"><CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" /> One workspace, four clear tabs — no hunting.</li>
              <li className="flex gap-2"><CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" /> Auto-save, version history, 30-day recovery bin.</li>
              <li className="flex gap-2"><CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" /> Rich editor with templates, equations and tags.</li>
              <li className="flex gap-2"><CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" /> Visible streaks, retention and due-today counters.</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Features</p>
          <h3 className="mt-2 font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Everything you need, nothing you don't.</h3>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <article
              key={f.title}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group animate-fade-in-up rounded-xl border border-border bg-card/85 p-6 shadow-card backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
            >
              <div className="grid size-11 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft transition group-hover:rotate-6">
                <f.icon className="size-5" />
              </div>
              <h4 className="mt-4 font-display text-base font-bold tracking-tight">{f.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </article>
          ))}
        </div>
      </section>



      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-20 text-center">
        <h3 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Ready for your next study session?</h3>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Sign up in seconds, build your first deck and study without distractions.
        </p>
        <Link
          to={ctaTo}
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
        >
          {user ? "Open the studio" : "Create your account"} <ArrowRight className="size-4" />
        </Link>
      </section>

      <footer className="relative z-10 border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MLFI · Micro-Learning Flashcard Interface
      </footer>
    </main>
  );
};

export default Landing;
