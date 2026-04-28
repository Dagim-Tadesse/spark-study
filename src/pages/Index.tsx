import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Clock3,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import { profileService, Profile } from "../services/profileService";
import Layout from "../components/Layout";
import { cn } from "@/lib/utils";

const Index = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<(Deck & { progress?: number })[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedDecks, fetchedCards, fetchedProfile] = await Promise.all([
          deckService.getDecks(user.id),
          cardService.getCards(user.id),
          profileService.getProfile(user.id)
        ]);
        
        setDecks(fetchedDecks.map(d => ({ ...d, progress: 0 })));
        setCards(fetchedCards);
        setProfile(fetchedProfile);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const dueTodayCount = useMemo(() => {
    if (!cards.length) return 0;
    const now = Date.now();
    return cards.filter(card => !card.next_review || card.next_review <= now).length;
  }, [cards]);

  const retention = profile && profile.total_reviews > 0 
    ? Math.round((profile.successful_reviews / profile.total_reviews) * 100) 
    : 100;

  const stats = [
    { label: "Retention Rate", value: `${retention}%`, icon: Brain, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Current Streak", value: `${profile?.streak ?? 0} days`, icon: Sparkles, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Cards Due", value: `${dueTodayCount}`, icon: Clock3, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  return (
    <Layout>
      <div className="space-y-10 pb-10 animate-in fade-in duration-700">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-400 to-indigo-500 p-8 md:p-12 text-white shadow-soft">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest">
                <Zap className="size-3 fill-current" /> Level Up Your Learning
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                {dueTodayCount > 0 
                  ? `You have ${dueTodayCount} cards to review today.` 
                  : "You're all caught up for today!"}
              </h2>
              <p className="text-white/80 text-lg font-medium">Keep your memory streak alive and master your subjects with spaced repetition.</p>
              <div className="pt-4">
                 <Link to="/study" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary rounded-2xl font-black text-lg transition-all hover:scale-105 hover:shadow-2xl active:scale-95 group">
                   Start Studying <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                 </Link>
              </div>
            </div>
            <div className="hidden lg:block shrink-0">
               <div className="relative size-48">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                  <div className="absolute inset-4 bg-white/20 rounded-full animate-pulse [animation-delay:200ms]" />
                  <div className="absolute inset-0 grid place-items-center">
                     <Brain className="size-24 text-white" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-soft transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("size-6", stat.color)} />
                </div>
              </div>
              <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
              <p className="text-4xl font-black mt-1 tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Recent Activity */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="size-6 text-primary" />
                    Recent Decks
                 </h3>
                 <Link to="/decks" className="text-sm font-bold text-primary hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {decks.slice(0, 4).map(deck => (
                    <Link key={deck.id} to="/decks" className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-soft flex items-center gap-4">
                       <div className={cn("size-12 rounded-xl flex items-center justify-center text-white font-bold", deck.color)}>
                          {deck.name.charAt(0)}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{deck.name}</p>
                          <p className="text-xs text-muted-foreground">{cards.filter(c => c.deck_id === deck.id).length} cards</p>
                       </div>
                       <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                    </Link>
                 ))}
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-secondary/30 border border-border/50 space-y-4">
                 <h4 className="font-bold flex items-center gap-2">
                    <Sparkles className="size-4 text-orange-500" />
                    Did you know?
                 </h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                    Spaced repetition is 3x more effective than traditional studying. Reviewing your cards right before you forget them is the secret to perfect memory!
                 </p>
                 <div className="pt-2">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-2/3 rounded-full" />
                    </div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mt-2">Daily Goal Progress: 66%</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
