"use client";

import React from "react";
import { useWorkoutStore } from "@/lib/store";
import { generateWorkoutFeedback } from "@/lib/ai/feedback";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { Trophy, Target, Repeat, Flame, TrendingUp, X, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

function scoreClass(s: number) { return s >= 85 ? "text-emerald-400" : s >= 65 ? "text-amber-400" : "text-rose-400"; }

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setLastSession(null)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring" as const, damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl"
      >
        <div className="relative glass-elevated rounded-3xl overflow-hidden">
          <div className="accent-line" />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5 border-b border-white/[0.04]">
            <button onClick={() => setLastSession(null)} className="absolute top-4 right-4 md:top-6 md:right-6 h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-200 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/15 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Workout Complete</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <span className="text-zinc-300 font-semibold">{displayExercise}</span>
              {lastSession.weight != null && <span className="glass-card rounded-lg px-2 py-0.5 text-xs tabular-nums">{lastSession.weight} lbs</span>}
              {lastSession.isRecorded && <Badge variant="outline" className="gap-1 border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-[10px]"><CheckCircle2 className="h-3 w-3" />Recorded</Badge>}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[min(70vh,calc(92vh-200px))] overflow-y-auto px-6 pb-6 pt-4 md:px-8 md:pb-8 space-y-5">
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { icon: <Repeat className="h-3.5 w-3.5" />, label: "Reps", value: `${reps.length}` },
                { icon: <Target className="h-3.5 w-3.5" />, label: "Avg Score", value: `${totalScore}`, cls: scoreClass(totalScore) },
                { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Best Rep", value: `${bestScore}`, cls: scoreClass(bestScore) },
                { icon: <Flame className="h-3.5 w-3.5" />, label: "Calories", value: `${caloriesBurned}` },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5"><span>{s.icon}</span>{s.label}</div>
                  <div className={cn("text-lg font-black tabular-nums", s.cls)}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {chartData.length > 1 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 mb-2.5">Score per Rep</h3>
                <GlassCard className="p-4"><div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="rep" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "11px", backdropFilter: "blur(12px)" }} formatter={(v) => [`${v ?? "—"}`, "Score"]} labelFormatter={(l) => `Rep ${l}`} />
                      <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#06b6d4", stroke: "#030305", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div></GlassCard>
              </div>
            )}

            {topMistakes.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 mb-2.5">Common Issues</h3>
                <div className="space-y-1.5">{topMistakes.map(([mistake, count]) => (
                  <div key={mistake} className="flex items-start justify-between gap-3 glass-card rounded-xl px-4 py-2.5">
                    <div className="flex items-start gap-2.5 min-w-0"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" /><span className="text-sm text-amber-200">{mistake}</span></div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-amber-400">{count}×</span>
                  </div>
                ))}</div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-2.5 flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />AI Coach Analysis</h3>
              <GlassCard glow className="p-4"><p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{feedback}</p></GlassCard>
            </div>

            <button onClick={() => setLastSession(null)} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 py-3.5 text-base font-bold text-white transition-all hover:shadow-[0_0_32px_-4px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-[0.98]">
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
