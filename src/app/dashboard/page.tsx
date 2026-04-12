"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricTile } from "@/components/ui/metric-tile";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FoodTracker } from "@/components/nutrition/food-tracker";
import { getSessions, getDailyLogs, getStreakData, getTodayFoodCalories, getFoodLog, getUserProfile } from "@/lib/storage";
import { WorkoutSession, DailyLog, StreakData, FoodEntry, UserProfile } from "@/types";
import { getGoalLabel } from "@/lib/calories";
import { BarChart3, Trophy, Flame, Target, Repeat, TrendingUp, Calendar, Zap, UtensilsCrossed, AlertTriangle, Star, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

const TT: React.CSSProperties = {
  background: "rgba(0,0,0,0.8)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  fontSize: "11px",
  backdropFilter: "blur(12px)",
  padding: "8px 12px",
};
const G = "rgba(255,255,255,0.04)";
const A = "#52525b";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, bestStreak: 0, lastWorkoutDate: "", workoutDates: [] });
  const [todayFoodCalories, setTodayFoodCalories] = useState(0);
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refresh = () => { setSessions(getSessions()); setDailyLogs(getDailyLogs()); setStreak(getStreakData()); setTodayFoodCalories(getTodayFoodCalories()); setFoodLog(getFoodLog()); setProfile(getUserProfile()); };
  useEffect(() => {
    queueMicrotask(() => { refresh(); });
    const onFoodChanged = () => { setTodayFoodCalories(getTodayFoodCalories()); setFoodLog(getFoodLog()); };
    window.addEventListener("food-changed", onFoodChanged);
    return () => window.removeEventListener("food-changed", onFoodChanged);
  }, []);

  const totalReps = sessions.reduce((s, x) => s + x.reps.length, 0);
  const avgScore = sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + x.totalScore, 0) / sessions.length) : 0;
  const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s => s.totalScore)) : 0;
  const calorieGoal = profile?.calorieGoal || 2000;
  const pctRaw = Math.round((todayFoodCalories / Math.max(1, calorieGoal)) * 100);
  const calorieProgress = Math.min(100, pctRaw);
  const isOver = todayFoodCalories > calorieGoal;

  const scoreTrend = sessions.slice(-20).map((s, i) => ({ session: i + 1, score: s.totalScore }));
  const repsPerDay = dailyLogs.slice(-14).map(d => ({ date: d.date.slice(5), reps: d.totalReps, score: d.avgScore }));
  const foodCalsByDay: Record<string, number> = {};
  for (const e of foodLog) foodCalsByDay[e.date] = (foodCalsByDay[e.date] || 0) + e.calories;
  const caloriesPerDay = Object.entries(foodCalsByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([d, c]) => ({ date: d.slice(5), calories: c }));

  // Advanced analytics data
  const allRepScores = sessions.flatMap(s => s.reps.map(r => r.score));
  const scoreDistribution = (() => {
    const buckets = [
      { range: "0-40", count: 0, fill: "#f43f5e" },
      { range: "41-60", count: 0, fill: "#f97316" },
      { range: "61-80", count: 0, fill: "#fbbf24" },
      { range: "81-90", count: 0, fill: "#34d399" },
      { range: "91-100", count: 0, fill: "#06b6d4" },
    ];
    for (const s of allRepScores) {
      if (s <= 40) buckets[0].count++;
      else if (s <= 60) buckets[1].count++;
      else if (s <= 80) buckets[2].count++;
      else if (s <= 90) buckets[3].count++;
      else buckets[4].count++;
    }
    return buckets.filter(b => b.count > 0);
  })();

  const mistakeFrequency = (() => {
    const counts: Record<string, number> = {};
    for (const s of sessions) {
      for (const r of s.reps) {
        for (const iss of r.issues) {
          if (iss.message) counts[iss.message] = (counts[iss.message] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 22) + "..." : name, count }));
  })();

  const perfectReps = allRepScores.filter(s => s >= 90).length;
  const totalAllReps = allRepScores.length;
  const perfectRate = totalAllReps > 0 ? Math.round((perfectReps / totalAllReps) * 100) : 0;

  const allTimeBestRep = sessions.reduce((best, s) => {
    const score = s.bestRepScore ?? 0;
    return score > best.score ? { score, exercise: s.exerciseName || s.exercise, date: s.startTime } : best;
  }, { score: 0, exercise: "", date: 0 });

  const hasData = sessions.length > 0;

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Dashboard</h1>
          <p className="text-zinc-500 mt-2">Your training intelligence</p>
        </motion.div>

        <div className="space-y-6">
            {/* ── Stat tiles ── */}
            {hasData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricTile icon={<Repeat className="h-4 w-4" />} label="Total Reps" value={totalReps.toLocaleString()} />
              <MetricTile icon={<Target className="h-4 w-4" />} label="Avg Score" value={`${avgScore}`} accent={avgScore >= 85 ? "text-emerald-400" : avgScore >= 65 ? "text-amber-400" : "text-rose-400"} />
              <MetricTile icon={<Zap className="h-4 w-4" />} label="Streak" value={`${streak.currentStreak}d`} accent="text-cyan-400" />
              <MetricTile icon={<Trophy className="h-4 w-4" />} label="Best Score" value={`${bestScore}`} accent="text-emerald-400" />
              <MetricTile icon={<Star className="h-4 w-4" />} label="Perfect Reps" value={`${perfectReps}`} accent="text-amber-400" />
            </div>
            )}

            {/* ── Calorie + Streak row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <GlassCard glow className="lg:col-span-2 p-6 relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent" />
                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Flame className="h-5 w-5 text-amber-400" />
                    <h3 className="font-bold text-zinc-200">Today&apos;s Calories</h3>
                    {profile?.weightGoal && <Badge variant="outline" className="text-[10px] text-zinc-500">{getGoalLabel(profile.weightGoal)}</Badge>}
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl md:text-5xl font-black tabular-nums">{todayFoodCalories}</span>
                    <span className="text-base text-zinc-600">/ {calorieGoal} kcal</span>
                  </div>
                  <Progress value={calorieProgress} className="h-2.5 bg-white/[0.04] rounded-full mb-2" indicatorClassName={cn("rounded-full", isOver ? "bg-rose-400" : pctRaw > 80 ? "bg-amber-400" : "bg-cyan-400")} />
                  <div className="flex justify-between text-xs text-zinc-600">
                    <span>{isOver ? <span className="text-rose-400">{pctRaw}% — over</span> : `${pctRaw}%`}</span>
                    <span className="tabular-nums">{isOver ? `${todayFoodCalories - calorieGoal} over` : `${Math.max(0, calorieGoal - todayFoodCalories)} remaining`}</span>
                  </div>
                </div>
              </GlassCard>

              <div className="grid grid-rows-2 gap-4">
                <GlassCard className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1 flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-cyan-400" />Current Streak</div>
                  <div className="text-3xl font-black text-cyan-400 tabular-nums">{streak.currentStreak}<span className="text-lg text-cyan-400/40 ml-0.5">d</span></div>
                </GlassCard>
                <GlassCard className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-amber-400" />Best Streak</div>
                  <div className="text-3xl font-black text-amber-400 tabular-nums">{streak.bestStreak}<span className="text-lg text-amber-400/40 ml-0.5">d</span></div>
                </GlassCard>
              </div>
            </div>

            {/* ── Perfect Rep Highlight ── */}
            {hasData && perfectReps > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GlassCard className="p-5 relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent" />
                  <div className="relative">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-amber-400" />All-Time Best Rep</div>
                    <div className="text-3xl font-black text-amber-400 tabular-nums">{allTimeBestRep.score}<span className="text-lg text-amber-400/40 ml-0.5">/100</span></div>
                    {allTimeBestRep.exercise && <div className="text-[10px] text-zinc-600 mt-1">{allTimeBestRep.exercise} · {new Date(allTimeBestRep.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>}
                  </div>
                </GlassCard>
                <GlassCard className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />Perfect Reps</div>
                  <div className="text-3xl font-black text-amber-400 tabular-nums">{perfectReps}</div>
                  <div className="text-[10px] text-zinc-600 mt-1">out of {totalAllReps} total reps</div>
                </GlassCard>
                <GlassCard className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-1 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-cyan-400" />Perfect Rep Rate</div>
                  <div className="text-3xl font-black text-cyan-400 tabular-nums">{perfectRate}<span className="text-lg text-cyan-400/40 ml-0.5">%</span></div>
                  <Progress value={perfectRate} className="h-1.5 mt-2.5 bg-white/[0.04]" indicatorClassName={cn("transition-all duration-500", perfectRate >= 50 ? "bg-emerald-400" : perfectRate >= 25 ? "bg-amber-400" : "bg-cyan-400")} />
                </GlassCard>
              </div>
            )}

            {/* ── Food Tracker ── */}
            <GlassCard className="overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
                <UtensilsCrossed className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold">Nutrition</h3>
              </div>
              <div className="p-5"><FoodTracker onFoodChange={refresh} /></div>
            </GlassCard>

            {/* ── Charts ── */}
            {(hasData || caloriesPerDay.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scoreTrend.length > 1 && (
                  <ChartCard title="Score Trend" icon={<TrendingUp className="h-4 w-4 text-cyan-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={G} vertical={false} />
                        <XAxis dataKey="session" stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} />
                        <YAxis domain={[0, 100]} stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} width={32} />
                        <Tooltip contentStyle={TT} formatter={(v) => [`${v ?? ""}`, "Score"]} />
                        <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} fill="url(#sg)" dot={false} activeDot={{ r: 4, fill: "#06b6d4", stroke: "#030305", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {repsPerDay.length > 0 && (
                  <ChartCard title="Reps per Day" icon={<Repeat className="h-4 w-4 text-cyan-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={repsPerDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={G} vertical={false} />
                        <XAxis dataKey="date" stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} />
                        <YAxis stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} width={32} />
                        <Tooltip contentStyle={TT} formatter={(v) => [`${v ?? ""}`, "Reps"]} />
                        <Bar dataKey="reps" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {caloriesPerDay.length > 0 && (
                  <ChartCard title="Calories Logged" icon={<Flame className="h-4 w-4 text-amber-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={caloriesPerDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={G} vertical={false} />
                        <XAxis dataKey="date" stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} />
                        <YAxis stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} width={36} />
                        <Tooltip contentStyle={TT} formatter={(v) => [`${Number(v).toLocaleString()} kcal`, "Logged"]} />
                        <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {repsPerDay.length > 0 && (
                  <ChartCard title="Daily Avg Score" icon={<Target className="h-4 w-4 text-cyan-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={repsPerDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={G} vertical={false} />
                        <XAxis dataKey="date" stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} />
                        <YAxis domain={[0, 100]} stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} width={32} />
                        <Tooltip contentStyle={TT} formatter={(v) => [`${v ?? ""}`, "Score"]} />
                        <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 3, stroke: "#030305", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </div>
            )}

            {/* ── Advanced Analytics ── */}
            {hasData && (mistakeFrequency.length > 0 || scoreDistribution.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {scoreDistribution.length > 0 && (
                  <ChartCard title="Score Distribution" icon={<Activity className="h-4 w-4 text-cyan-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={G} vertical={false} />
                        <XAxis dataKey="range" stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} />
                        <YAxis stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} width={32} />
                        <Tooltip contentStyle={TT} formatter={(v) => [`${v ?? ""}`, "Reps"]} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
                {mistakeFrequency.length > 0 && (
                  <ChartCard title="Common Mistakes" icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mistakeFrequency} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={G} horizontal={false} />
                        <XAxis type="number" stroke={A} tick={{ fontSize: 10, fill: A }} tickLine={false} axisLine={{ stroke: G }} />
                        <YAxis type="category" dataKey="name" stroke={A} tick={{ fontSize: 9, fill: A }} tickLine={false} axisLine={{ stroke: G }} width={100} />
                        <Tooltip contentStyle={TT} formatter={(v) => [`${v ?? ""}`, "Times"]} />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </div>
            )}

            {/* ── Recent Sessions ── */}
            {hasData && (
              <GlassCard className="overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold">Recent Sessions</h3>
                </div>
                <div className="p-4 space-y-2">
                  {sessions.slice(-10).reverse().map((session) => {
                    const hasPerfect = (session.bestRepScore ?? 0) >= 90;
                    return (
                    <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl glass-card px-4 py-3 hover:bg-white/[0.03] transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate flex items-center gap-2 text-zinc-200">
                          {session.exerciseName || session.exercise.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                          {session.weight != null && <span className="text-[10px] text-zinc-600 tabular-nums">{session.weight} lbs</span>}
                          {session.isRecorded && <span className="text-[9px] text-cyan-400/60 font-bold uppercase tracking-wider">REC</span>}
                          {hasPerfect && <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 font-bold uppercase tracking-wider"><Flame className="h-2.5 w-2.5" />PR</span>}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">{new Date(session.startTime).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {session.reps.length} reps{hasPerfect ? ` · Best ${session.bestRepScore}` : ""}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("text-lg font-black tabular-nums", session.totalScore >= 85 ? "text-emerald-400" : session.totalScore >= 65 ? "text-amber-400" : "text-rose-400")}>{session.totalScore}</span>
                        <Progress value={session.totalScore} className="w-14 h-1 bg-white/[0.04]" indicatorClassName={session.totalScore >= 85 ? "bg-emerald-400" : session.totalScore >= 65 ? "bg-amber-400" : "bg-rose-400"} />
                      </div>
                    </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
      <GlassCard className="h-full">
        <div className="px-5 pt-4 pb-2 flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-bold text-zinc-300">{title}</span>
        </div>
        <div className="px-3 pb-4 h-48 md:h-52">{children}</div>
      </GlassCard>
    </motion.div>
  );
}
