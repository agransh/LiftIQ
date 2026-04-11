"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FoodTracker } from "@/components/nutrition/food-tracker";
import {
  getSessions,
  getDailyLogs,
  getStreakData,
  getTodayFoodCalories,
  getFoodLog,
  getUserProfile,
  fetchSessions,
  fetchStreakData,
  fetchFoodLog,
  fetchUserProfile,
  rebuildDailyLogs,
} from "@/lib/storage";
import { WorkoutSession, DailyLog, StreakData, FoodEntry, UserProfile } from "@/types";
import { getGoalLabel } from "@/lib/calories";
import {
  BarChart3,
  Trophy,
  Flame,
  Target,
  Repeat,
  TrendingUp,
  Calendar,
  Zap,
  UtensilsCrossed,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastWorkoutDate: "",
    workoutDates: [],
  });
  const [todayFoodCalories, setTodayFoodCalories] = useState(0);
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshLocal = () => {
    setSessions(getSessions());
    setDailyLogs(getDailyLogs());
    setStreak(getStreakData());
    setTodayFoodCalories(getTodayFoodCalories());
    setFoodLog(getFoodLog());
    setProfile(getUserProfile());
  };

  useEffect(() => {
    refreshLocal();
    // Fetch from Supabase and update
    (async () => {
      const [s, st, fl, p] = await Promise.all([
        fetchSessions(), fetchStreakData(), fetchFoodLog(), fetchUserProfile(),
      ]);
      setSessions(s);
      setDailyLogs(rebuildDailyLogs(s));
      setStreak(st);
      setFoodLog(fl);
      setProfile(p);
      const today = new Date().toISOString().split("T")[0];
      setTodayFoodCalories(fl.filter((e) => e.date === today).reduce((sum, e) => sum + e.calories, 0));
    })();
  }, []);

  const totalReps = sessions.reduce((sum, s) => sum + s.reps.length, 0);
  const avgScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.totalScore, 0) / sessions.length
        )
      : 0;
  const bestScore =
    sessions.length > 0 ? Math.max(...sessions.map((s) => s.totalScore)) : 0;

  const calorieGoal = profile?.calorieGoal || 2000;
  const calorieProgress = Math.min(100, Math.round((todayFoodCalories / calorieGoal) * 100));
  const caloriesRemaining = Math.max(0, calorieGoal - todayFoodCalories);

  const scoreTrend = sessions.slice(-20).map((s, i) => ({
    session: i + 1,
    score: s.totalScore,
    exercise: s.exercise,
  }));

  const repsPerDay = dailyLogs.slice(-14).map((d) => ({
    date: d.date.slice(5),
    reps: d.totalReps,
    score: d.avgScore,
  }));

  const foodCalsByDay: Record<string, number> = {};
  for (const entry of foodLog) {
    foodCalsByDay[entry.date] = (foodCalsByDay[entry.date] || 0) + entry.calories;
  }
  const caloriesPerDay = Object.entries(foodCalsByDay)
    .slice(-14)
    .map(([date, cals]) => ({
      date: date.slice(5),
      calories: cals,
      goal: calorieGoal,
    }));

  const hasData = sessions.length > 0;

  const chartTooltipStyle = {
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "8px",
    fontSize: "11px",
  };

  return (
    <div className="min-h-[100dvh] bg-background has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Dashboard
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Workouts, nutrition, and streaks
          </p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Calorie Goal Card */}
          <Card className="bg-card/50 border-border/50 overflow-hidden">
            <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                  <span className="text-sm md:text-base font-semibold">Today&apos;s Calories</span>
                </div>
                {profile?.weightGoal && (
                  <Badge variant="outline" className="text-[10px]">
                    {getGoalLabel(profile.weightGoal)}
                  </Badge>
                )}
              </div>

              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl md:text-4xl font-bold tabular-nums text-orange-400">
                  {todayFoodCalories}
                </span>
                <span className="text-sm text-muted-foreground mb-1">/ {calorieGoal} cal</span>
              </div>

              <Progress
                value={calorieProgress}
                className="h-2.5 mb-2"
                indicatorClassName={
                  calorieProgress > 100
                    ? "bg-red-400"
                    : calorieProgress > 80
                    ? "bg-orange-400"
                    : "bg-emerald-400"
                }
              />

              <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                <span>{calorieProgress}% of daily goal</span>
                <span>
                  {caloriesRemaining > 0
                    ? `${caloriesRemaining} cal remaining`
                    : `${todayFoodCalories - calorieGoal} cal over`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Top stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard
              icon={<Repeat className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              label="Total Reps"
              value={totalReps.toString()}
            />
            <StatCard
              icon={<Target className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              label="Avg Score"
              value={hasData ? `${avgScore}` : "\u2014"}
              valueClass={
                avgScore >= 85
                  ? "text-emerald-400"
                  : avgScore >= 65
                  ? "text-yellow-400"
                  : hasData
                  ? "text-red-400"
                  : undefined
              }
            />
            <StatCard
              icon={<Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              label="Streak"
              value={`${streak.currentStreak}d`}
            />
            <StatCard
              icon={<Trophy className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              label="Best Score"
              value={hasData ? `${bestScore}` : "\u2014"}
              valueClass={hasData ? "text-emerald-400" : undefined}
            />
          </div>

          {/* Streak row */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-4 md:pt-6">
                <div className="flex items-center gap-1.5 text-[10px] md:text-sm text-muted-foreground mb-1">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Current </span>Streak
                </div>
                <div className="text-xl md:text-3xl font-bold text-primary">
                  {streak.currentStreak}
                  <span className="text-xs md:text-base text-muted-foreground ml-1">d</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-4 md:pt-6">
                <div className="flex items-center gap-1.5 text-[10px] md:text-sm text-muted-foreground mb-1">
                  <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="hidden sm:inline">Best </span>Streak
                </div>
                <div className="text-xl md:text-3xl font-bold">
                  {streak.bestStreak}
                  <span className="text-xs md:text-base text-muted-foreground ml-1">d</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 pb-4 md:pt-6">
                <div className="flex items-center gap-1.5 text-[10px] md:text-sm text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Sessions
                </div>
                <div className="text-xl md:text-3xl font-bold">
                  {sessions.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Food Tracker */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6">
              <FoodTracker />
            </CardContent>
          </Card>

          {/* Charts */}
          {(hasData || caloriesPerDay.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {scoreTrend.length > 1 && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 px-4 pt-4 md:px-6 md:pt-6">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Score Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 md:px-6">
                    <div className="h-40 md:h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scoreTrend}>
                          <defs>
                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00e68a" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#00e68a" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="session" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#71717a" fontSize={10} tickLine={false} width={30} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Area type="monotone" dataKey="score" stroke="#00e68a" strokeWidth={2} fill="url(#scoreGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {repsPerDay.length > 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 px-4 pt-4 md:px-6 md:pt-6">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-primary" />
                      Reps per Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 md:px-6">
                    <div className="h-40 md:h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={repsPerDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} tickLine={false} width={30} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Bar dataKey="reps" fill="#00e68a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {caloriesPerDay.length > 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 px-4 pt-4 md:px-6 md:pt-6">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-400" />
                      Calories vs Goal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 md:px-6">
                    <div className="h-40 md:h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={caloriesPerDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={10} tickLine={false} width={35} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="goal" stroke="#4ade80" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {repsPerDay.length > 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-2 px-4 pt-4 md:px-6 md:pt-6">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Daily Avg Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4 md:px-6">
                    <div className="h-40 md:h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={repsPerDay}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#71717a" fontSize={10} tickLine={false} width={30} />
                          <Tooltip contentStyle={chartTooltipStyle} />
                          <Line type="monotone" dataKey="score" stroke="#00e68a" strokeWidth={2} dot={{ fill: "#00e68a", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recent sessions */}
          {hasData && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="space-y-2 md:space-y-3">
                  {sessions
                    .slice(-10)
                    .reverse()
                    .map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5 md:px-4 md:py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs md:text-sm truncate flex items-center gap-1.5">
                            {session.exerciseName || session.exercise
                              .split("-")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(" ")}
                            {session.weight && (
                              <span className="text-muted-foreground font-normal">
                                @ {session.weight} lbs
                              </span>
                            )}
                            {session.isRecorded && (
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0">REC</Badge>
                            )}
                          </div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">
                            {new Date(session.startTime).toLocaleDateString()} •{" "}
                            {session.reps.length} reps
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-3">
                          <div
                            className={cn(
                              "text-base md:text-lg font-bold tabular-nums",
                              session.totalScore >= 85
                                ? "text-emerald-400"
                                : session.totalScore >= 65
                                ? "text-yellow-400"
                                : "text-red-400"
                            )}
                          >
                            {session.totalScore}
                          </div>
                          <Progress
                            value={session.totalScore}
                            className="w-14 md:w-20 h-1.5"
                            indicatorClassName={
                              session.totalScore >= 85
                                ? "bg-emerald-400"
                                : session.totalScore >= 65
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!hasData && foodLog.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
              <BarChart3 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-lg md:text-xl font-semibold mb-2">No Data Yet</h2>
              <p className="text-sm text-muted-foreground max-w-md px-4">
                Complete a workout or log some food to see your progress here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="pt-4 pb-4 md:pt-6">
        <div className="flex items-center gap-1.5 text-[10px] md:text-sm text-muted-foreground mb-1">
          {icon}
          {label}
        </div>
        <div className={cn("text-xl md:text-2xl font-bold tabular-nums", valueClass)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
