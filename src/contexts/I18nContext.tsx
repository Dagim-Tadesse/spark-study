import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "am";

const dict = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.library": "Library",
    "nav.study": "Study",
    "nav.help": "Help",
    "nav.about": "About",
    "nav.signout": "Logout",
    "nav.signin": "Sign in",
    "nav.getStarted": "Get started",
    "common.search": "Search decks...",
    "common.add": "Add Card",
    "common.newDeck": "New Deck",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.know": "Know",
    "common.review": "Review Again",
    "common.flip": "Tap to reveal answer",
    "settings.title": "Accessibility & Settings",
    "settings.theme": "Theme",
    "settings.colorblind": "Color-blind safe palette",
    "settings.colorblindHint": "Adds patterns + Okabe-Ito safe colors",
    "settings.language": "Language",
    "settings.fontSize": "Larger text",
    "settings.reduceMotion": "Reduce motion",
    "editor.front": "Front Side",
    "editor.back": "Back Side",
    "editor.tags": "Tags",
    "editor.placeholderQ": "Type the question here...",
    "editor.placeholderA": "Type the answer here...",
    "editor.preview": "Live preview",
    "editor.empty": "Create or pick a card to preview it.",
  },
  am: {
    "nav.dashboard": "ዳሽቦርድ",
    "nav.library": "ቤተመጻሕፍት",
    "nav.study": "ማጥናት",
    "nav.help": "እርዳታ",
    "nav.about": "ስለ",
    "nav.signout": "ውጣ",
    "nav.signin": "ግባ",
    "nav.getStarted": "ጀምር",
    "common.search": "ካርዶችን ፈልግ...",
    "common.add": "ካርድ ጨምር",
    "common.newDeck": "አዲስ ካርድ ስብስብ",
    "common.delete": "ሰርዝ",
    "common.cancel": "ሰርዝ",
    "common.know": "አውቃለሁ",
    "common.review": "እንደገና ገምግም",
    "common.flip": "መልስ ለማየት ንካ",
    "settings.title": "ተደራሽነት እና ቅንብሮች",
    "settings.theme": "ገጽታ",
    "settings.colorblind": "ቀለም ዓይነ ስውር ደህንነት",
    "settings.colorblindHint": "ንድፎችን + ደህንነቱ የተጠበቀ ቀለሞችን ይጨምራል",
    "settings.language": "ቋንቋ",
    "settings.fontSize": "ትልቅ ጽሑፍ",
    "settings.reduceMotion": "እንቅስቃሴ ቀንስ",
    "editor.front": "የፊት ጎን",
    "editor.back": "የኋላ ጎን",
    "editor.tags": "መለያዎች",
    "editor.placeholderQ": "ጥያቄውን እዚህ ይጻፉ...",
    "editor.placeholderA": "መልሱን እዚህ ይጻፉ...",
    "editor.preview": "ቀጥታ ቅድመ-እይታ",
    "editor.empty": "ለማየት ካርድ ይምረጡ ወይም ይፍጠሩ።",
  },
} as const;

type Key = keyof (typeof dict)["en"];

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Key) => string;
}

const Ctx = createContext<I18nCtx | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("mlfi-lang") as Lang) || "en");

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("mlfi-lang", lang);
  }, [lang]);

  const t = (key: Key) => dict[lang][key] ?? dict.en[key] ?? String(key);

  return <Ctx.Provider value={{ lang, setLang: setLangState, t }}>{children}</Ctx.Provider>;
};

export const useI18n = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
};
