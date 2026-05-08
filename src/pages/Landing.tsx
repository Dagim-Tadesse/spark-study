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
import { useI18n } from "@/contexts/I18nContext";

const Landing = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const ctaTo = user ? "/decks" : "/login";

  const features = [
    { icon: Layers3, title: "Rich content cards", text: "Text, equations, lists, images and audio cues — all in one focused editor." },
    { icon: Wand2, title: "Smart templates", text: "Definition, Q&A, Formula and Diagram templates speed up card creation." },
    { icon: Brain, title: "Spaced study", text: "Flip cards, mark Know / Review again, and watch your retention grow." },
    { icon: ShieldCheck, title: "Safety first", text: "Auto-save, version history, undo and a 30-day recovery bin protect your work." },
    { icon: Clock3, title: "Daily streaks", text: "Lightweight stats and streaks keep micro-learning sessions consistent." },
    { icon: Sparkles, title: "Calm, focused UI", text: "Minimal layout, accessible contrast and motion that respects you." },
  ];

  const trustItems = [
    t("landing.noCreditCard"),
    t("landing.autoSave"),
    t("landing.keyboardFriendly"),
    t("landing.darkMode"),
  ];

  return (
    <div className="mlfi-shell min-h-screen overflow-x-hidden text-foreground">
      {/* Blobs */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-[6%] top-20 size-64 rounded-full bg-primary/15 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[8%] size-72 rounded-full bg-accent/15 blur-3xl animate-drift-delayed" />
      </div>

      <main className="relative z-10">
        {/* Nav */}
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-0.5">Spark</p>
              <span className="font-display text-lg font-black leading-none text-foreground tracking-tight">Study</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Only show sign-in links if user is NOT logged in */}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.signin")}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
                >
                  {t("nav.getStarted")} <ArrowRight className="size-4" />
                </Link>
              </>
            )}
            {/* Show open studio if logged in */}
            {user && (
              <Link
                to="/decks"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
              >
                {t("common.openStudio")} <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 md:pt-12">
          <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
            {/* Left: copy */}
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur shadow-soft">
                <span className="size-1.5 rounded-full bg-success animate-pulse-save" />
                <Sparkles className="size-3.5" /> {t("landing.badge")}
              </span>
              <h2 className="mt-5 font-display text-4xl leading-[1.05] font-black tracking-tighter sm:text-5xl lg:text-6xl">
                {t("landing.headline1")}{" "}
                <span
                  className="bg-clip-text text-transparent animate-gradient-x"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--study-back)), hsl(var(--primary)))",
                    backgroundSize: "300% 100%",
                  }}
                >
                  {t("landing.headline2")}
                </span>{" "}
                {t("landing.headline3")}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("landing.subheading")}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={ctaTo}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-primary px-8 py-4 text-base font-black text-primary-foreground shadow-xl transition hover:-translate-y-1"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {user ? t("landing.openStudio") : t("landing.getStartedFree")}
                  <ArrowRight className="size-5 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/decks"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card/80 px-8 py-4 text-base font-black text-foreground backdrop-blur transition hover:-translate-y-1 hover:border-primary/40"
                >
                  {t("landing.exploreDecks")}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
                {trustItems.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-success shrink-0" /> {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: card stack — hidden on mobile, shown md+ */}
            <div className="hidden md:block relative h-[480px] animate-scale-in">
              <div className="absolute inset-0 -z-0">
                <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 bg-gradient-primary opacity-25 blur-3xl animate-blob" />
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
                <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-25 blur-2xl" />
                <div className="relative rounded-2xl border border-border bg-card/95 p-6 shadow-soft backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                      Biology · Cell
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
                      <span className="size-1.5 rounded-full bg-success animate-pulse-save" /> Auto-saved
                    </span>
                  </div>
                  <p className="mt-5 font-display text-xl font-bold leading-tight">
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
                      <div key={s.l} className="rounded-md border border-border bg-secondary/50 p-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.l}</p>
                        <p className="text-base font-bold text-foreground">{s.v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marquee strip */}
          <div className="relative mt-12 overflow-hidden rounded-2xl border border-border bg-card/60 py-4 backdrop-blur">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
            <div className="flex w-max animate-marquee gap-10 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {[...Array(3)].flatMap((_, i) =>
                ["Spaced repetition", "30-day recovery", "Equations & code", "Streak tracking", "Keyboard shortcuts", "Dark mode", "Auto-save", "Version history"].map((text) => (
                  <span key={`${i}-${text}`} className="inline-flex items-center gap-2 whitespace-nowrap">
                    <Sparkles className="size-3 text-primary shrink-0" /> {text}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card/85 p-7 shadow-card backdrop-blur">
              <p className="text-xs font-black uppercase tracking-wider text-destructive">{t("landing.problemTitle")}</p>
              <h3 className="mt-2 font-display text-2xl font-bold">{t("landing.problemHeadline")}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Cluttered dashboards bury what matters today.</li>
                <li>• One wrong click deletes hours of work, with no recovery.</li>
                <li>• Editors lack support for equations, code or images.</li>
                <li>• No clear feedback on what to review next.</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-border bg-gradient-card p-7 shadow-soft backdrop-blur">
              <p className="text-xs font-black uppercase tracking-wider text-primary">{t("landing.solutionTitle")}</p>
              <h3 className="mt-2 font-display text-2xl font-bold">{t("landing.solutionHeadline")}</h3>
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
        <section id="features" className="mx-auto max-w-6xl px-5 py-12">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-wider text-primary">{t("landing.featuresTitle")}</p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight md:text-3xl">{t("landing.featuresHeadline")}</h3>
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
        <section className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("landing.ctaTitle")}</h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("landing.ctaBody")}</p>
          <Link
            to={ctaTo}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-8 py-4 text-base font-black text-primary-foreground shadow-xl transition hover:-translate-y-0.5"
          >
            {user ? t("landing.openStudio") : t("landing.createAccount")} <ArrowRight className="size-4" />
          </Link>
        </section>

        <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Spark Study · {t("landing.footer")}
        </footer>
      </main>
    </div>
  );
};

export default Landing;
