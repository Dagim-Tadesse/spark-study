import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface A11ySettings {
  colorBlind: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

interface A11yCtx extends A11ySettings {
  update: (patch: Partial<A11ySettings>) => void;
}

const Ctx = createContext<A11yCtx | undefined>(undefined);

const KEY = "mlfi-a11y";
const defaults: A11ySettings = { colorBlind: false, largeText: false, reduceMotion: false, highContrast: false };

export const A11yProvider = ({ children }: { children: ReactNode }) => {
  const [s, setS] = useState<A11ySettings>(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-cb", s.colorBlind);
    root.classList.toggle("a11y-lg", s.largeText);
    root.classList.toggle("a11y-rm", s.reduceMotion);
    root.classList.toggle("a11y-high-contrast", s.highContrast);
    localStorage.setItem(KEY, JSON.stringify(s));
  }, [s]);

  return <Ctx.Provider value={{ ...s, update: (p) => setS((c) => ({ ...c, ...p })) }}>{children}</Ctx.Provider>;
};

export const useA11y = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useA11y must be inside A11yProvider");
  return c;
};
