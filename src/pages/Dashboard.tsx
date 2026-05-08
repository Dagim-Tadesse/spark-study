import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Target, 
  Award,
  Flame,
  Clock,
  Plus,
  Play
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { profileService, Profile } from "../services/profileService";
import { cardService, Card } from "../services/cardService";
import { studyEventService, StudyEvent } from "../services/studyEventService";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { useI18n } from "../contexts/I18nContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [p, c, e] = await Promise.all([
          profileService.getProfile(user.id),
          cardService.getCards(user.id),
          studyEventService.getEvents(user.id)
        ]);
        setProfile(p);
        setCards(c);
        setEvents(e);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: t("dashboard.reviews"), value: profile?.total_reviews || 0, icon: BarChart3, color: "text-blue-500" },
    { label: t("dashboard.streak"), value: `${profile?.streak || 0}`, icon: Flame, color: "text-orange-500" },
    { label: t("dashboard.retention"), value: `${profile?.total_reviews ? Math.round((profile.successful_reviews / profile.total_reviews) * 100) : 0}%`, icon: Target, color: "text-emerald-500" },
    { label: t("library.cards"), value: cards.filter(c => c.interval > 30).length, icon: Award, color: "text-purple-500" },
  ];

  // Calculate real chart data for the last 7 days
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return last7Days.map(day => {
      const count = events.filter(e => isSameDay(new Date(e.timestamp), day)).length;
      return {
        day: format(day, "EEE"),
        reviews: count
      };
    });
  }, [events]);

  const dailyGoal = 20;
  const todayReviews = events.filter(e => isSameDay(new Date(e.timestamp), new Date())).length;
  const goalProgress = Math.min(100, (todayReviews / dailyGoal) * 100);

  if (isLoading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12 px-4 sm:px-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tight">{t("nav.dashboard")}</h2>
          <p className="text-muted-foreground font-medium">Track your progress and stay motivated.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`size-6 ${stat.color}`} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" /> {t("dashboard.activity")}
              </h3>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last 7 Days</div>
            </div>
            <div className="h-[300px] w-full">
              {events.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <BarChart3 className="size-12 mb-2" />
                  <p className="text-sm font-medium">No activity data yet.<br/>Start studying to see your progress!</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="reviews" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorReviews)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Gamification / Goals */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-primary to-accent p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Zap className="size-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">{t("dashboard.dailyGoal")}</p>
                  <p className="text-xl font-black">{todayReviews} / {dailyGoal} {t("library.cards")}</p>
                </div>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  className="h-full bg-white transition-all" 
                />
              </div>
              <p className="text-xs mt-4 opacity-90">
                {todayReviews >= dailyGoal ? "Goal achieved! Excellent work today!" : `Review ${dailyGoal - todayReviews} more cards to hit your daily goal.`}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="size-5 text-yellow-500" /> Recent Activity
              </h3>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">No recent activity found.</p>
                ) : (
                  events.slice(-5).reverse().map((event, i) => (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className="bg-secondary p-2 rounded-full">
                        <Clock className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Review Completed</p>
                        <p className="text-[10px] text-muted-foreground">Rating: {event.grade === 3 ? "Easy" : event.grade === 2 ? "Good" : "Again"}</p>
                      </div>
                      <span className="ml-auto text-[10px] text-muted-foreground">{format(new Date(event.timestamp), "HH:mm")}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm"
            >
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="size-5 text-primary" /> Quick Actions
              </h3>
              <div className="space-y-3">
                <Link 
                  to="/decks" 
                  state={{ action: 'new-deck' }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Plus className="size-4" />
                  </div>
                  <span className="text-sm font-bold">{t("common.newDeck")}</span>
                </Link>
                <Link 
                  to="/study" 
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Play className="size-4" />
                  </div>
                  <span className="text-sm font-bold">{t("nav.study")}</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
