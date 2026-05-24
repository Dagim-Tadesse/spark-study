import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<unknown>;
  signUp: (email: string, password: string, name?: string) => Promise<unknown>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider — Supabase-only. No insecure local fallback.
 * If Supabase env vars are missing, auth methods throw a clear error
 * instead of silently letting any email/password through.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn(
        "[Auth] Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY).",
      );
      setLoading(false);
      setReady(true);
      return;
    }

    // Set up listener BEFORE getSession (Supabase best practice)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
      } else {
        setUser(null);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" });
        }
      })
      .catch((err) => console.error("[Auth] getSession failed:", err))
      .finally(() => {
        setLoading(false);
        setReady(true);
      });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const requireSupabase = () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        "Authentication is not configured. Connect Lovable Cloud or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.",
      );
    }
  };

  const signIn = async (email: string, password: string) => {
    requireSupabase();
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    requireSupabase();
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${window.location.origin}/decks`,
        data: { display_name: name }
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("spark-study-demo-mode");
      window.location.href = "/";
    }
  };

  const enableDemoMode = () => {
    setUser({ id: "demo-user-123", email: "demo@example.com" });
    localStorage.setItem("spark-study-demo-mode", "true");
    setLoading(false);
  };

  // Rehydrate demo mode on refresh
  useEffect(() => {
    if (localStorage.getItem("spark-study-demo-mode") === "true") {
      setUser({ id: "demo-user-123", email: "demo@example.com" });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, ready, signIn, signUp, signOut, enableDemoMode }),
    [user, loading, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
