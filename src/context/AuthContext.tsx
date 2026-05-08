import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider wraps the app with Supabase auth.
 * On mount, it hydrates the user session from Supabase' getSession() / onAuthStateChange.
 * If Supabase is not configured (empty URL/key), it silently falls back to local-only mode.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Supabase not configured; fall back to localStorage
      const savedUser = localStorage.getItem("spark-study-user");
      if (savedUser) {
        setUser(JSON.parse(savedUser) as AuthUser);
      }
      setLoading(false);
      return;
    }

    // Supabase configured; hydrate session
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
          });
        }
      } catch (error) {
        console.error("Failed to get session:", error);
      } finally {
        setLoading(false);
      }
    })();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // Save user to localStorage as a fallback
  useEffect(() => {
    if (user) {
      localStorage.setItem("spark-study-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("spark-study-user");
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Local mode: just accept the email
      setUser({ id: email || "local-user", email: email || "user@spark.study" });
      return { user: { id: email }, session: {} };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      // Local mode: just accept the email
      const fakeUser = { id: email || "local-user", email: email || "user@spark.study" };
      setUser(fakeUser);
      return { user: fakeUser, session: {} };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: signIn as any,
      signUp: signUp as any,
      signOut,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
