import React, { useEffect, useState } from "react";
import { LiveAnnouncer } from "../components/LiveAnnouncer";
import FirstTimeTour from "./FirstTimeTour";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { SettingsButton } from "./SettingsButton";
import {
  LayoutDashboard,
  Library,
  BrainCircuit,
  LogOut,
  BookOpen,
  HelpCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { t } = useI18n();
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("spark-study-theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("spark-study-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const navItems = [
    { name: t("nav.home"), path: "/", icon: BookOpen },
    { name: t("nav.dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.library"), path: "/decks", icon: Library },
    { name: t("nav.study"), path: "/study", icon: BrainCircuit },
    { name: t("nav.help") || "Help", path: "/help", icon: HelpCircle },
    { name: t("nav.about") || "About", path: "/about", icon: Info },
  ];

  const [showTour, setShowTour] = useState<boolean>(() => {
    try {
      return !localStorage.getItem("spark_seen_tour");
    } catch {
      return false;
    }
  });

  return (
    <div className="mlfi-shell min-h-screen flex flex-col text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[8%] top-16 size-56 rounded-full bg-primary/10 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[10%] size-72 rounded-full bg-accent/10 blur-3xl animate-drift-delayed" />
      </div>

      <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-sidebar/90 px-4 py-3 backdrop-blur-xl shadow-soft">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="grid size-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft">
                <BookOpen className="size-4.5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Spark</p>
                <h1 className="font-display text-base font-black leading-none text-foreground tracking-tight">Study</h1>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-semibold transition-all",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SettingsButton darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="group flex items-center gap-2 rounded-md border border-transparent bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition hover:scale-105 hover:bg-destructive/20"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("nav.signout")}</span>
            </button>
          </div>
        </div>
            </nav>
      <LiveAnnouncer />
      <FirstTimeTour open={showTour} onClose={() => setShowTour(false)} />

      <main id="main-content" className="relative z-10 flex-1 w-full max-w-[1500px] mx-auto px-4 py-6 md:px-8 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-sidebar/95 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-md transition",
                location.pathname === item.path ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[9px] font-bold uppercase">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;
