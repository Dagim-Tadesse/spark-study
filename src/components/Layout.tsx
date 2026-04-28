import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Library, 
  BrainCircuit, 
  LogOut, 
  Sun, 
  Moon,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Library", path: "/decks", icon: Library },
    { name: "Study", path: "/study", icon: BrainCircuit },
  ];

  return (
    <div className="mlfi-shell min-h-screen flex flex-col text-foreground">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute left-[8%] top-16 size-56 rounded-full bg-primary/10 blur-3xl animate-drift" />
        <div className="absolute bottom-10 right-[10%] size-72 rounded-full bg-accent/10 blur-3xl animate-drift-delayed" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-sidebar/90 px-4 py-3 backdrop-blur-xl shadow-soft">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
              <div className="grid size-10 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft">
                <BookOpen className="size-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none mb-1">MLFI Studio</p>
                <h1 className="font-display text-xl font-bold leading-none text-foreground">Micro-Learn</h1>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:scale-105 hover:text-primary shadow-sm"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <div className="h-8 w-[1px] bg-border/50 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="group flex items-center gap-2 rounded-md border border-transparent bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive transition hover:scale-105 hover:bg-destructive/20"
              >
                <LogOut className="size-4 transition-transform group-hover:translate-x-1" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-[1500px] mx-auto px-4 py-6 md:px-8">
        {children}
      </main>

      {/* Mobile Navigation (Bottom Bar) */}
      <div className="md:hidden sticky bottom-0 z-50 w-full border-t border-border/70 bg-sidebar/90 px-4 py-3 backdrop-blur-xl shadow-[0_-4px_24px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-md transition-all duration-200",
                location.pathname === item.path
                  ? "text-primary scale-110"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;
