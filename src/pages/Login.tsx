import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Brain, ArrowLeft, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { useI18n } from "@/contexts/I18nContext";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();
  const { signIn, signUp, enableDemoMode } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      return;
    }
    if (loading) return;
    
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Please fill in all fields");
      if (mode === "signup" && password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (mode === "signup") {
        const data = await signUp(email, password, name);
        
        if (data?.user && !data?.session) {
          toast.success("Account created! Please check your email to verify your account before logging in.");
          setMode("signin");
          setPassword("");
          setLoading(false);
          return;
        }
        
        toast.success("Welcome aboard!");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
      }
      
      navigate("/decks");
    } catch (error) {
      console.error("Auth error:", error);
      const message = error instanceof Error ? error.message : "Authentication failed. Check your connection and credentials.";
      toast.error(message);
      setLoading(false);
    } finally {
      // Note: we don't always want to set loading false here if we are navigating
      // but if an error occurred or we stayed on the page, we should.
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
        <section className="hidden lg:block animate-fade-in-up">
          {!isSupabaseConfigured && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold mb-6">
              ⚠️ Supabase is not configured. Real Auth will not work until you add your keys to the .env file.
            </div>
          )}
          <div className="rounded-[2.5rem] border border-border bg-gradient-card p-12 shadow-xl backdrop-blur relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="size-32" />
            </div>
            <div className="grid size-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Brain className="size-8" />
            </div>
            <h2 className="mt-8 font-display text-5xl font-black leading-tight tracking-tight">
              Study smarter,<br /> in tiny bursts.
            </h2>
            <p className="mt-6 max-w-md text-lg text-muted-foreground font-medium leading-relaxed">
              Spark Study gives you a calm space to capture, encode, recall and master what matters — built for high-performance learning.
            </p>
            <ul className="mt-10 space-y-4 text-sm">
              {[
                { i: ShieldCheck, t: "Auto-save and real-time sync" },
                { i: Sparkles, t: "Rich Media: Image, Math & Audio" },
                { i: Zap, t: "Keyboard-first, accessible UI" },
              ].map(({ i: Icon, t }) => (
                <li key={t} className="flex items-center gap-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-bold text-base">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Auth card */}
        <section className="animate-scale-in">
          <div className="mx-auto w-full max-w-md rounded-[2.5rem] border border-border bg-card/95 p-10 shadow-2xl backdrop-blur-xl">
            <div className="text-center">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Brain className="size-7" />
              </div>
              <h1 className="mt-6 font-display text-3xl font-black tracking-tight">
                {mode === "signin" ? t("nav.signin") : "Create account"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
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
