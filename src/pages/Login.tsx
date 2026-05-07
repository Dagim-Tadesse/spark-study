import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Brain, ArrowLeft, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Please fill in all fields");
      if (mode === "signup" && password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (mode === "signup") {
        await signUp(email, password);
        toast.success("Welcome aboard! Check your email to verify your account.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
      navigate("/app");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mlfi-shell relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[6%] top-20 size-72 rounded-full bg-primary/15 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[8%] size-80 rounded-full bg-accent/15 blur-3xl animate-drift-delayed" />
      </div>

      <Link
        to="/"
        className="relative z-10 mx-5 mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to home
      </Link>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-2">
        {/* Brand panel */}
        <section className="hidden md:block animate-fade-in-up">
          <div className="rounded-3xl border border-border bg-gradient-card p-10 shadow-soft backdrop-blur">
            <div className="grid size-14 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Brain className="size-7" />
            </div>
            <h2 className="mt-6 font-display text-4xl font-bold leading-tight">
              Study smarter,<br /> in tiny bursts.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              MLFI gives you a calm space to capture, encode, recall and master what matters — built around six HCI goals.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                { i: ShieldCheck, t: "Auto-save and 30-day recovery" },
                { i: Sparkles, t: "Templates: Q&A, Formula, Definition" },
                { i: Zap, t: "Keyboard-first, accessible UI" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-semibold">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Auth card */}
        <section className="animate-scale-in">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card/95 p-8 shadow-soft backdrop-blur-xl">
            <div className="text-center">
              <div className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="size-6" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin" ? "Log in to continue your study streak." : "Start studying in less than a minute."}
              </p>
            </div>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="mt-6 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted p-1"
            >
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setEmail("");
                    setPassword("");
                    setName("");
                    setShowPassword(false);
                  }}
                  className={`rounded-sm px-3 py-2 text-sm font-bold transition ${
                    mode === m ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Display name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 pr-10 text-sm focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60"
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our calm-by-default usage and accessibility principles.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
