"use client";

import React, { useState, useCallback } from "react";
import { useWorkoutStore } from "@/lib/store";
import { generateWorkoutFeedback } from "@/lib/ai/feedback";
import { generateFormExplanations, getExplanationsForIssues } from "@/lib/ai/explainer";
import { FormExplanation } from "@/lib/ai/explainer-prompts";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Repeat, Flame, X, AlertTriangle, Sparkles, CheckCircle2, MessageCircle, Star, Lightbulb, Loader2, Wrench } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from "recharts";
import { cn } from "@/lib/utils";

function scoreClass(s: number) { return s >= 85 ? "text-emerald-400" : s >= 65 ? "text-amber-400" : "text-rose-400"; }

export function PostWorkoutSummary() {
  const { lastSession, setLastSession } = useWorkoutStore();
  const [showExplanations, setShowExplanations] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<FormExplanation[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [hasLoadedAI, setHasLoadedAI] = useState(false);

  const loadAIExplanations = useCallback(async () => {
    if (!lastSession || hasLoadedAI) return;
    setLoadingAI(true);
    try {
      const allIssues = lastSession.reps.flatMap(r => r.issues);
      const results = await generateFormExplanations(allIssues, lastSession.exercise);
      setAiExplanations(results);
    } catch {
      // Fall through — sync fallback already shown
    } finally {
      setLoadingAI(false);
      setHasLoadedAI(true);
    }
  }, [lastSession, hasLoadedAI]);

  if (!lastSession) return null;

  const { reps, totalScore, caloriesBurned, exercise, startTime, endTime } = lastSession;
  const bestRepIndex = lastSession.bestRepIndex ?? (reps.length > 0 ? reps.reduce((b, r, i) => (r.score > reps[b].score ? i : b), 0) : -1);
  const bestRepScore = bestRepIndex >= 0 ? reps[bestRepIndex].score : 0;
  const allIssues = reps.flatMap(r => r.issues);
  const issueCounts: Record<string, number> = {};
  for (const issue of allIssues) if (issue.message) issueCounts[issue.message] = (issueCounts[issue.message] || 0) + 1;
  const topMistakes = Object.entries(issueCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  const chartData = reps.map((r, i) => ({ rep: i + 1, score: r.score, isBest: i === bestRepIndex }));
  const feedback = generateWorkoutFeedback({ exercise, reps, avgScore: totalScore, duration: endTime ? Math.floor((endTime - startTime) / 1000) : 0 });
  const displayExercise = lastSession.exerciseName || exercise.charAt(0).toUpperCase() + exercise.slice(1).replace("-", " ");

  const syncExplanations = getExplanationsForIssues(allIssues, exercise);
  const explanations = aiExplanations.length > 0 ? aiExplanations : syncExplanations;

  const handleExplainClick = () => {
    const next = !showExplanations;
    setShowExplanations(next);
    if (next && !hasLoadedAI) {
      void loadAIExplanations();
    }
  };

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
                { icon: <Star className="h-3.5 w-3.5" />, label: "Best Rep", value: `${bestRepScore}`, cls: scoreClass(bestRepScore) },
                { icon: <Flame className="h-3.5 w-3.5" />, label: "Calories", value: `${caloriesBurned}` },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-1.5"><span>{s.icon}</span>{s.label}</div>
                  <div className={cn("text-lg font-black tabular-nums", s.cls)}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Best rep highlight */}
            {bestRepScore >= 90 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 px-4 py-3"
              >
                <Flame className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-amber-300">Perfect Rep #{bestRepIndex + 1}</span>
                  <span className="text-xs text-amber-400/70 ml-2">Score {bestRepScore}/100</span>
                </div>
              </motion.div>
            )}

            {/* Score per rep chart */}
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
                      {bestRepIndex >= 0 && (
                        <ReferenceDot x={bestRepIndex + 1} y={bestRepScore} r={7} fill="#f59e0b" stroke="#030305" strokeWidth={2} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div></GlassCard>
              </div>
            )}

            {/* Common Issues */}
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

            {/* AI Coach Analysis */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-2.5 flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-400" />AI Coach Analysis</h3>
              <GlassCard glow className="p-4"><p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{feedback}</p></GlassCard>
            </div>

            {/* AI Form Explanations */}
            {explanations.length > 0 && (
              <div>
                <button
                  onClick={handleExplainClick}
                  className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors mb-3"
                >
                  <MessageCircle className="h-4 w-4" />
                  {showExplanations ? "Hide AI Explanations" : "Explain My Form Issues"}
                  {loadingAI && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-500" />}
                </button>
                <AnimatePresence>
                  {showExplanations && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {explanations.map((exp, i) => (
                        <AIExplanationCard key={exp.title + i} explanation={exp} index={i} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button onClick={() => setLastSession(null)} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 py-3.5 text-base font-bold text-white transition-all hover:shadow-[0_0_32px_-4px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-[0.98]">
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AIExplanationCard({ explanation, index }: { explanation: FormExplanation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <GlassCard className="p-0 overflow-hidden">
        {/* Accent top bar */}
        <div className="h-[2px] bg-gradient-to-r from-cyan-500/60 via-blue-500/40 to-transparent" />

        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">{explanation.title}</h4>
          </div>

          {/* Explanation */}
          <div className="flex items-start gap-2.5 pl-1">
            <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-cyan-400 shrink-0" />
            <p className="text-[13px] text-zinc-400 leading-relaxed">{explanation.explanation}</p>
          </div>

          {/* Fix tip */}
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 px-3.5 py-2.5">
            <Wrench className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
            <p className="text-[13px] text-emerald-300/90 leading-relaxed">{explanation.fixTip}</p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
