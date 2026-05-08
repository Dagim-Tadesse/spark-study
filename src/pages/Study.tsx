import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  ArrowLeftRight, 
  Trophy,
  BookOpen,
  RefreshCcw,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import { profileService, Profile } from "../services/profileService";
import Layout from "../components/Layout";
import { cn } from "@/lib/utils";

const Study = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isStudying, setIsStudying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [fetchedDecks, fetchedCards, fetchedProfile] = await Promise.all([
        deckService.getDecks(user.id),
        cardService.getCards(user.id),
        profileService.getProfile(user.id)
      ]);
      setDecks(fetchedDecks);
      setCards(fetchedCards);
      setProfile(fetchedProfile);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isStudying || isFinished) {
        if (e.key === "Escape" && isStudying) setIsStudying(false);
        return;
      }
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const k = e.key.toLowerCase();
      if (k === "f" || k === " ") { e.preventDefault(); setFlipped((v) => !v); }
      else if ((k === "k" || k === "n") && flipped) { e.preventDefault(); markStudy(true); }
      else if (k === "r" && flipped) { e.preventDefault(); markStudy(false); }
      else if (k === "escape") setIsStudying(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudying, isFinished, flipped, currentCardIndex]);

  const sessionCards = useMemo(() => {
    if (!selectedDeckId) return [];
    const deckCards = cards.filter(c => c.deck_id === selectedDeckId);
    const now = Date.now();
    const due = deckCards.filter(c => !c.next_review || c.next_review <= now);
    return due.length > 0 ? due : deckCards;
  }, [cards, selectedDeckId]);

  const currentCard = sessionCards[currentCardIndex];

  const startStudy = (deckId: string) => {
    setSelectedDeckId(deckId);
    setCurrentCardIndex(0);
    setFlipped(false);
    setIsStudying(true);
    setIsFinished(false);
    setSessionCount(0);
  };

  const markStudy = async (known: boolean) => {
    if (!currentCard || !user || !profile) return;
    setFlipped(false);
    setSessionCount(prev => prev + 1);
    const now = Date.now();
    const currentInterval = currentCard.interval || 0;
    const newInterval = known ? (currentInterval === 0 ? 1 : currentInterval * 2) : 0;
    const nextReview = now + newInterval * 24 * 60 * 60 * 1000;
    const todayStr = new Date().toDateString();

    let newStreak = profile.streak;
    if (profile.last_study_date !== todayStr) newStreak += 1;

    const updatedProfile = {
      ...profile,
      streak: newStreak,
      last_study_date: todayStr,
      total_reviews: profile.total_reviews + 1,
      successful_reviews: profile.successful_reviews + (known ? 1 : 0),
    };

    setProfile(updatedProfile);
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, interval: newInterval, next_review: nextReview } : c));

    cardService.updateCard(currentCard.id, { interval: newInterval, next_review: nextReview }).catch(console.error);
    profileService.updateProfile(user.id, {
      streak: newStreak,
      last_study_date: todayStr,
      total_reviews: updatedProfile.total_reviews,
      successful_reviews: updatedProfile.successful_reviews
    }).catch(console.error);

    if (currentCardIndex < sessionCards.length - 1) {
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 300);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  if (!isStudying) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Daily Reviews</h2>
              <p className="text-muted-foreground text-sm">Select a deck to start your session.</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-sm font-bold transition-all">
              <RefreshCcw className="size-4" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map(deck => {
              const count = cards.filter(c => c.deck_id === deck.id && (!c.next_review || c.next_review <= Date.now())).length;
              return (
                <button
                  key={deck.id} onClick={() => startStudy(deck.id)}
                  className="group relative overflow-hidden flex flex-col p-6 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-soft hover:-translate-y-1 transition-all text-left"
                >
                  <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10", deck.color)} />
                  <div className="flex items-center justify-between mb-4">
                    <BookOpen className="size-6 text-primary" />
                    {count > 0 && <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase animate-pulse">{count} Due</span>}
                  </div>
                  <h3 className="text-lg font-bold truncate">{deck.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cards.filter(c => c.deck_id === deck.id).length} total cards</p>
                </button>
              );
            })}
            
            <Link to="/decks" className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/40 transition-all group">
              <Plus className="size-8 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
              <p className="text-sm font-bold text-muted-foreground group-hover:text-primary">Create New Deck</p>
            </Link>
          </div>

          {decks.length === 0 && (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-border">
              <BookOpen className="size-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No decks found. Let's create your first one!</p>
              <Link to="/decks" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm">Go to Library</Link>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (isFinished) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <Trophy className="size-16 mx-auto text-success animate-bounce" />
          <h2 className="text-4xl font-bold">Session Complete!</h2>
          <div className="grid grid-cols-2 gap-4 text-left">
             <div className="bg-card p-6 rounded-2xl border border-border"><p className="text-xs font-black text-muted-foreground uppercase mb-1">Reviewed</p><p className="text-3xl font-bold">{sessionCount} Cards</p></div>
             <div className="bg-card p-6 rounded-2xl border border-border"><p className="text-xs font-black text-muted-foreground uppercase mb-1">Streak</p><p className="text-3xl font-bold text-orange-500">{profile?.streak} Days</p></div>
          </div>
          <button onClick={() => setIsStudying(false)} className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-soft">Done</button>
        </div>
      </Layout>
    );
  }

  if (sessionCards.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
           <BookOpen className="size-16 mx-auto text-orange-500 opacity-50" />
           <h2 className="text-3xl font-bold">Empty Deck</h2>
           <p className="text-muted-foreground">Add some cards in the Library to start studying!</p>
           <Link to="/decks" className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold">Go to Library</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setIsStudying(false)} className="text-muted-foreground font-bold text-sm hover:text-primary">← End Session</button>
          <div className="flex items-center gap-4 flex-1 max-w-xs px-8">
             <div className="h-2 w-full bg-secondary rounded-full overflow-hidden"><div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%` }} /></div>
          </div>
          <span className="text-xs font-bold text-muted-foreground">{currentCardIndex + 1} / {sessionCards.length}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center perspective-[1200px]">
          <div className={cn("relative w-full aspect-video md:aspect-[16/10] preserve-3d transition-all duration-700 shadow-2xl rounded-[2.5rem]", flipped ? "rotate-y-180" : "")} onClick={() => setFlipped(!flipped)}>
            <div className="absolute inset-0 backface-hidden bg-primary p-12 rounded-[2.5rem] flex items-center justify-center text-center text-white border-8 border-white/5"><p className="text-3xl md:text-4xl font-bold leading-tight">{currentCard?.front}</p></div>
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-success p-12 rounded-[2.5rem] flex items-center justify-center text-center text-white border-8 border-white/5"><p className="text-3xl md:text-4xl font-bold leading-tight whitespace-pre-line">{currentCard?.back}</p></div>
          </div>
        </div>

        <div className={cn("grid grid-cols-2 gap-4 transition-all duration-300", flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none")}>
          <button onClick={() => markStudy(false)} className="py-5 rounded-2xl bg-card border-2 border-border font-bold text-lg hover:border-warning hover:text-warning transition-colors">Review Again <kbd className="ml-2 text-xs opacity-60">R</kbd></button>
          <button onClick={() => markStudy(true)} className="py-5 rounded-2xl bg-success text-success-foreground font-bold text-lg hover:shadow-soft transition-all">Know <kbd className="ml-2 text-xs opacity-80">K</kbd></button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">Shortcuts: <kbd className="rounded bg-muted px-1.5 py-0.5">F</kbd> flip · <kbd className="rounded bg-muted px-1.5 py-0.5">K</kbd> know · <kbd className="rounded bg-muted px-1.5 py-0.5">R</kbd> review · <kbd className="rounded bg-muted px-1.5 py-0.5">Esc</kbd> end</p>
      </div>
    </Layout>
  );
};

export default Study;
