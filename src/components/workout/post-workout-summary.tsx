"use client";

import React from "react";
import { useWorkoutStore } from "@/lib/store";
import { generateWorkoutFeedback } from "@/lib/ai/feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Trophy, Target, Repeat, Flame, TrendingUp, X, AlertTriangle, Sparkles, CheckCircle2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

function scoreClass(score: number) {
  if (score >= 85) return "text-green-400";
  if (score >= 65) return "text-amber-400";
  return "text-rose-400";
}

export function PostWorkoutSummary() {
  const { lastSession, setLastSession } = useWorkoutStore();
  if (!lastSession) return null;

  const { reps, totalScore, caloriesBurned, exercise, startTime, endTime } = lastSession;
  const bestScore = reps.length > 0 ? Math.max(...reps.map(r => r.score)) : 0;
  const allIssues = reps.flatMap(r => r.issues);
  const issueCounts: Record<string, number> = {};
  for (const issue of allIssues) if (issue.message) issueCounts[issue.message] = (issueCounts[issue.message] || 0) + 1;
  const topMistakes = Object.entries(issueCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  const chartData = reps.map((r, i) => ({ rep: i + 1, score: r.score }));
  const feedback = generateWorkoutFeedback({ exercise, reps, avgScore: totalScore, duration: endTime ? Math.floor((endTime - startTime) / 1000) : 0 });
  const displayExercise = lastSession.exerciseName || exercise.charAt(0).toUpperCase() + exercise.slice(1).replace("-", " ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setLastSession(null)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl"
      >
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="gradient-bar" />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5 border-b border-zinc-800">
            <button
              onClick={() => setLastSession(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 h-9 w-9 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Workout Complete</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span className="text-zinc-300 font-medium">{displayExercise}</span>
              {lastSession.weight != null && (
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs tabular-nums border border-zinc-700">{lastSession.weight} lbs</span>
              )}
              {lastSession.isRecorded && (
                <Badge variant="outline" className="gap-1 border-purple-500/20 bg-purple-500/10 text-purple-400 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" />
                  Recorded
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[min(70vh,calc(92vh-200px))] overflow-y-auto px-6 pb-6 pt-4 md:px-8 md:pb-8 space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { icon: <Repeat className="h-3.5 w-3.5" />, label: "Reps", value: `${reps.length}` },
                { icon: <Target className="h-3.5 w-3.5" />, label: "Avg Score", value: `${totalScore}`, cls: scoreClass(totalScore) },
                { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Best Rep", value: `${bestScore}`, cls: scoreClass(bestScore) },
                { icon: <Flame className="h-3.5 w-3.5" />, label: "Calories", value: `${caloriesBurned}` },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-center"
                >
                  <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-zinc-600 mb-1.5">
                    <span className="text-zinc-500">{s.icon}</span>
                    {s.label}
                  </div>
                  <div className={cn("text-lg font-bold tabular-nums", s.cls)}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2.5">Score per Rep</h3>
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="rep" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={32} />
                        <Tooltip
                          contentStyle={{ background: "rgba(24, 24, 27, 0.95)", border: "1px solid rgba(63, 63, 70, 0.6)", borderRadius: "10px", fontSize: "11px" }}
                          formatter={(v) => [`${v ?? "—"}`, "Score"]}
                          labelFormatter={(l) => `Rep ${l}`}
                        />
                        <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#a855f7", stroke: "#18181b", strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Mistakes */}
            {topMistakes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2.5">Common Issues</h3>
                <div className="space-y-1.5">
                  {topMistakes.map(([mistake, count]) => (
                    <div key={mistake} className="flex items-start justify-between gap-3 rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                        <span className="text-sm text-amber-200">{mistake}</span>
                      </div>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-amber-400">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Feedback */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2.5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                AI Coach Analysis
              </h3>
              <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-4">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{feedback}</p>
              </div>
            </div>

            <Button
              onClick={() => setLastSession(null)}
              size="lg"
              className="w-full rounded-xl text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
            >
              Done
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
