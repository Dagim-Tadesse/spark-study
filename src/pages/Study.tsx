import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  RotateCcw,
  Check,
  ArrowLeftRight,
  Trophy,
  BookOpen,
  RefreshCcw,
  Plus,
  Zap,
  Copy,
  Clock,
  Volume2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { deckService, Deck } from "../services/deckService";
import { cardService, Card } from "../services/cardService";
import { profileService, Profile } from "../services/profileService";
import { srsService, SRSGrade } from "../services/srsService";
import { studyEventService } from "../services/studyEventService";
import Layout from "../components/Layout";
import ProgressDonut from "../components/ProgressDonut";
import { cn } from "@/lib/utils";
import { useI18n } from "../contexts/I18nContext";

const MarkdownRenderer = ({
  content,
  className,
}: {
  content: string;
  className?: string;
}) => {
  // If content looks like HTML, render it as is
  if (content.includes("<") && content.includes(">")) {
    return (
      <div
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none w-full break-words text-white prose-headings:text-white prose-p:text-white prose-strong:text-white",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const renderLine = (line: string, i: number) => {
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch)
      return (
        <img
          key={i}
          src={imgMatch[2]}
          alt={imgMatch[1]}
          className="max-w-full max-h-[250px] rounded-xl shadow-lg my-4 object-contain mx-auto"
        />
      );

    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={i} className={cn("leading-relaxed", className)}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-white bg-white/20 px-1 rounded">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  };
  return (
    <div className="space-y-2 w-full flex flex-col items-center">
      {content.split("\n").map((line, i) => renderLine(line, i))}
    </div>
  );
};

const Study = () => {
  const { t } = useI18n();
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
        profileService.getProfile(user.id),
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
      if (k === "f" || k === " ") {
        e.preventDefault();
        setFlipped((v) => !v);
      } else if (flipped) {
        if (k === "1") {
          e.preventDefault();
          markStudy(0);
        } else if (k === "2") {
          e.preventDefault();
          markStudy(1);
        } else if (k === "3") {
          e.preventDefault();
          markStudy(2);
        } else if (k === "4") {
          e.preventDefault();
          markStudy(3);
        }
      } else if (k === "escape") setIsStudying(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudying, isFinished, flipped, currentCardIndex]);

  const sessionCards = useMemo(() => {
    if (!selectedDeckId) return [];
    const deckCards = cards.filter((c) => c.deck_id === selectedDeckId);
    const now = Date.now();
    const due = deckCards.filter((c) => !c.next_review || c.next_review <= now);
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

  const markStudy = async (grade: SRSGrade) => {
    if (!currentCard || !user || !profile) return;
    setFlipped(false);
    setSessionCount((prev) => prev + 1);

    const {
      interval: newInterval,
      ease: newEase,
      nextReview,
    } = srsService.calculate(
      grade,
      currentCard.interval || 0,
      currentCard.ease || 2.5,
    );

    const todayStr = new Date().toDateString();
    const known = grade >= 1;

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
    setCards((prev) =>
      prev.map((c) =>
        c.id === currentCard.id
          ? {
              ...c,
              interval: newInterval,
              ease: newEase,
              next_review: nextReview,
            }
          : c,
      ),
    );

    cardService
      .updateCard(currentCard.id, {
        interval: newInterval,
        ease: newEase,
        next_review: nextReview,
      })
      .catch(console.error);
    studyEventService
      .logEvent(user.id, currentCard.id, grade)
      .catch(console.error);
    profileService
      .updateProfile(user.id, {
        streak: newStreak,
        last_study_date: todayStr,
        total_reviews: updatedProfile.total_reviews,
        successful_reviews: updatedProfile.successful_reviews,
      })
      .catch(console.error);

    if (currentCardIndex < sessionCards.length - 1) {
      setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 300);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#f59e0b"],
      });
    }
  };

  const speak = (htmlContent: string) => {
    window.speechSynthesis.cancel();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    const utterance = new SpeechSynthesisUtterance(plainText);
    window.speechSynthesis.speak(utterance);
  };

  if (isLoading)
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );

  if (!isStudying) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tight">
                {t("nav.study")}
              </h2>
              <p className="text-muted-foreground font-medium">
                {t("study.selectDeck")}
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 text-sm font-bold transition-all"
            >
              <RefreshCcw className="size-4" /> {t("common.refresh")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => {
              const count = cards.filter(
                (c) =>
                  c.deck_id === deck.id &&
                  (!c.next_review || c.next_review <= Date.now()),
              ).length;
              return (
                <button
                  key={deck.id}
                  onClick={() => startStudy(deck.id)}
                  className="group relative overflow-hidden flex flex-col p-6 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-soft hover:-translate-y-1 transition-all text-left"
                >
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10",
                      deck.color,
                    )}
                  />
                  <div className="flex items-center justify-between mb-4">
                    <BookOpen className="size-6 text-primary" />
                    {count > 0 && (
                      <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase animate-pulse">
                        {count} Due
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black truncate">{deck.name}</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                    {cards.filter((c) => c.deck_id === deck.id).length}{" "}
                    {t("library.cards")}
                  </p>
                </button>
              );
            })}

            <Link
              to="/decks"
              className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border bg-secondary/20 hover:bg-secondary/40 transition-all group"
            >
              <Plus className="size-8 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
              <p className="text-sm font-bold text-muted-foreground group-hover:text-primary">
                {t("common.createDeck")}
              </p>
            </Link>
          </div>

          {decks.length === 0 && (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-border">
              <BookOpen className="size-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">
                No decks found. Let's create your first one!
              </p>
              <Link
                to="/decks"
                className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg font-bold text-sm"
              >
                {t("common.goToLibrary")}
              </Link>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (isFinished) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-500 px-6">
          <Trophy className="size-16 mx-auto text-emerald-500 animate-bounce" />
          <h2 className="text-4xl font-black">{t("study.finished")}</h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Reviewed
              </p>
              <p className="text-3xl font-black">
                {sessionCount} {t("library.cards")}
              </p>
            </div>
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                {t("dashboard.streak")}
              </p>
              <p className="text-3xl font-black text-orange-500">
                {profile?.streak}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsStudying(false)}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all"
          >
            {t("study.backToLibrary")}
          </button>
        </div>
      </Layout>
    );
  }

  if (sessionCards.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
          <BookOpen className="size-16 mx-auto text-orange-500 opacity-50" />
          <h2 className="text-3xl font-bold">{t("study.emptyDeck")}</h2>
          <p className="text-muted-foreground">{t("study.emptyDeckMsg")}</p>
          <Link
            to="/decks"
            className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold"
          >
            {t("common.goToLibrary")}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="max-w-3xl mx-auto flex flex-col px-4"
        style={{ height: "calc(100vh - 130px)", maxHeight: "800px" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsStudying(false)}
              className="text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="size-3" /> {t("common.cancel")}
            </button>
            {sessionCards[currentCardIndex + 1] && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-secondary/50 rounded-lg text-[10px] text-muted-foreground">
                <span className="font-black uppercase opacity-50">
                  {t("study.next")}
                </span>
                <span className="truncate max-w-[100px] font-bold">
                  {sessionCards[currentCardIndex + 1].front.slice(0, 20)}...
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 flex-1 max-w-xs px-8">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentCardIndex < sessionCards.length - 1)
                  setCurrentCardIndex((prev) => prev + 1);
                else setIsFinished(true);
                setFlipped(false);
              }}
              className="px-4 py-1.5 text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-all border border-primary/20"
            >
              {t("study.skip")} →
            </button>
            <div className="text-[10px] font-black bg-secondary px-3 py-1.5 rounded-full border border-border">
              {currentCardIndex + 1} <span className="opacity-40">/</span>{" "}
              {sessionCards.length}
            </div>
            <div className="hidden sm:block">
              <ProgressDonut
                percent={((currentCardIndex + 1) / Math.max(1, sessionCards.length)) * 100}
                size={44}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col justify-center perspective-[1200px] py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard?.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full h-full"
            >
              <div
                className={cn(
                  "relative w-full preserve-3d transition-all duration-700 shadow-2xl rounded-[2rem] cursor-pointer",
                  flipped ? "rotate-y-180" : "",
                )}
                style={{ minHeight: "min(380px, 50vh)" }}
                onClick={() => setFlipped(!flipped)}
              >
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary to-primary/90 p-6 md:p-10 rounded-[2rem] flex flex-col items-center justify-center text-center text-white border-8 border-white/5 shadow-inner overflow-y-auto custom-scrollbar">
                  <div className="absolute top-6 flex flex-col items-center gap-1">
                    <span className="px-4 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                      {t("study.question")}
                    </span>
                    {decks.find((d) => d.id === selectedDeckId)?.tags && (
                      <div className="flex gap-1">
                        {decks
                          .find((d) => d.id === selectedDeckId)
                          ?.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="text-[8px] font-bold text-white/50 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl md:text-4xl font-bold leading-tight drop-shadow-sm w-full">
                    <MarkdownRenderer content={currentCard?.front || ""} />
                  </div>
                  <div className="absolute bottom-8 flex items-center gap-4">
                    <p className="text-white/50 text-xs font-medium animate-pulse">
                      {t("study.tapToFlip")}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(currentCard?.front || "");
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Speak"
                    >
                      <Volume2 className="size-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 md:p-10 rounded-[2rem] flex flex-col items-center justify-center text-center text-white border-8 border-white/5 shadow-inner overflow-y-auto custom-scrollbar">
                  <span className="absolute top-6 px-4 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                    {t("study.answer")}
                  </span>
                  <div className="text-2xl md:text-4xl font-bold leading-tight whitespace-pre-line drop-shadow-sm w-full">
                    <MarkdownRenderer content={currentCard?.back || ""} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speak(currentCard?.back || "");
                    }}
                    className="absolute bottom-8 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title="Speak"
                  >
                    <Volume2 className="size-4 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const temp = document.createElement("div");
                      temp.innerHTML = currentCard?.back || "";
                      const text = temp.textContent || temp.innerText || "";
                      navigator.clipboard?.writeText(text).catch(() => {});
                    }}
                    className="absolute bottom-8 right-16 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title="Copy"
                  >
                    <Copy className="size-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rating buttons — always visible */}
        <div
          className={cn(
            "grid grid-cols-4 gap-2 transition-all duration-500",
            flipped
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          {[
            {
              grade: 0 as SRSGrade,
              label: t("study.again"),
              color:
                "hover:bg-destructive/10 hover:border-destructive text-destructive",
              sub: t("study.reset"),
              key: "1",
            },
            {
              grade: 1 as SRSGrade,
              label: t("study.hard"),
              color:
                "hover:bg-orange-500/10 hover:border-orange-500 text-orange-600",
              sub: t("study.slow"),
              key: "2",
            },
            {
              grade: 2 as SRSGrade,
              label: t("study.good"),
              color: "hover:bg-primary/10 hover:border-primary text-primary",
              sub: t("study.ideal"),
              key: "3",
            },
            {
              grade: 3 as SRSGrade,
              label: t("study.easy"),
              color:
                "hover:bg-emerald-500/10 hover:border-emerald-500 text-emerald-600",
              sub: t("study.push"),
              key: "4",
            },
          ].map((btn) => {
            const nextTime = srsService.getEstimatedTime(
              srsService.calculate(
                btn.grade,
                currentCard?.interval || 0,
                currentCard?.ease || 2.5,
              ).interval,
            );
            return (
              <button
                key={btn.label}
                onClick={() => markStudy(btn.grade)}
                className={cn(
                  "relative flex flex-col items-center justify-center py-3 rounded-2xl bg-card border-2 border-border font-bold transition-all hover:-translate-y-1 hover:shadow-md group",
                  btn.color,
                )}
              >
                <span className="text-lg">{btn.label}</span>
                <span className="text-[10px] opacity-60 uppercase tracking-tighter mt-1">
                  {nextTime} · {btn.sub}
                </span>
                <kbd className="absolute top-2 right-2 hidden md:block text-[9px] opacity-30 border border-current rounded px-1 group-hover:opacity-100 transition-opacity">
                  {btn.key}
                </kbd>
              </button>
            );
          })}
        </div>

        {/* Keyboard hint — compact */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 py-3 px-4 bg-primary/5 rounded-2xl border border-primary/10 text-[10px] font-black text-primary/70 tracking-tight">
          <p className="flex items-center gap-1.5">
            <kbd className="rounded-lg border border-primary/20 bg-white px-2 py-0.5 shadow-soft text-primary text-[10px]">
              SPACE
            </kbd>{" "}
            {t("study.flip")}
          </p>
          <p className="flex items-center gap-1.5">
            <kbd className="rounded-lg border border-primary/20 bg-white px-2 py-0.5 shadow-soft text-primary text-[10px]">
              1-4
            </kbd>{" "}
            {t("study.rate")}
          </p>
          <p className="flex items-center gap-1.5">
            <kbd className="rounded-lg border border-primary/20 bg-white px-2 py-0.5 shadow-soft text-primary text-[10px]">
              ESC
            </kbd>{" "}
            {t("study.end")}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Study;
