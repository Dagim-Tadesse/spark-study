import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("spark-study-user");
    return savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("spark-study-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("spark-study-user");
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: (email: string) => {
        setUser({ id: email || "local-user", email: email || "user@spark.study" });
      },
      signOut: () => setUser(null),
    }),
    [user],
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
