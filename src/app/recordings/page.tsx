"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSessions } from "@/lib/storage";
import { getExplanationsForIssues, generateFormExplanations } from "@/lib/ai/explainer";
import { FormExplanation } from "@/lib/ai/explainer-prompts";
import { getAllRecordingsMeta, getRecordingBlob, deleteRecording, type RecordingMeta } from "@/lib/storage/recordings-db";
import { WorkoutSession, PERFECT_REP_REASON_LABELS, PerfectRepReason } from "@/types";
import { Video, Play, Trash2, X, Clock, Target, Repeat, Download, Star, AlertTriangle, Sparkles, MessageCircle, Flame, Lightbulb, Loader2, Wrench, Crown, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from "recharts";
import { cn } from "@/lib/utils";

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const scoreBadgeVariant = (s: number) => s >= 85 ? "success" : s >= 65 ? "warning" : "destructive";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ meta: RecordingMeta; url: string } | null>(null);
  const [linkedSession, setLinkedSession] = useState<WorkoutSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadRecordings = async () => { setRecordings(await getAllRecordingsMeta()); };
  useEffect(() => { queueMicrotask(() => { void loadRecordings(); }); }, []);
  useEffect(() => { if (!activeVideo) return; const p = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = p; }; }, [activeVideo]);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveVideo(v => { if (v) URL.revokeObjectURL(v.url); return null; }); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, []);

  const handlePlay = async (m: RecordingMeta) => {
    if (activeVideo) URL.revokeObjectURL(activeVideo.url);
    const b = await getRecordingBlob(m.id);
    if (b) setActiveVideo({ meta: m, url: URL.createObjectURL(b) });
    const sessions = getSessions();
    const match = sessions.find(s => s.recordingId === m.id || s.id === m.sessionId);
    setLinkedSession(match || null);
  };
  const handleClose = () => { if (activeVideo) { URL.revokeObjectURL(activeVideo.url); setActiveVideo(null); } setLinkedSession(null); };
  const handleDelete = async (id: string) => { await deleteRecording(id); if (activeVideo?.meta.id === id) handleClose(); loadRecordings(); };
  const handleDownload = async (m: RecordingMeta) => { const b = await getRecordingBlob(m.id); if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `LiftIQ-${m.exerciseName}-${new Date(m.createdAt).toISOString().slice(0, 10)}.webm`; a.click(); URL.revokeObjectURL(u); };

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Performance Library</h1>
          <p className="text-zinc-500 mt-2">Review recordings with AI-powered insights</p>
        </motion.div>

        {/* Video modal with insights */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
              <motion.div className="w-full max-w-4xl my-8" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} transition={{ type: "spring" as const, stiffness: 400, damping: 30 }} onClick={(e) => e.stopPropagation()}>
                <GlassCard elevated className="p-5 rounded-3xl">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-black truncate">{activeVideo.meta.exerciseName}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{new Date(activeVideo.meta.createdAt).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={scoreBadgeVariant(activeVideo.meta.score)} className="font-mono tabular-nums">Score {activeVideo.meta.score}</Badge>
                        <span className="text-xs text-zinc-500"><Repeat className="h-3 w-3 inline mr-1" />{activeVideo.meta.reps} reps</span>
                        <span className="text-xs text-zinc-500"><Clock className="h-3 w-3 inline mr-1" />{formatDuration(activeVideo.meta.duration)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-white/[0.08] bg-white/[0.02]" onClick={() => handleDownload(activeVideo.meta)}><Download className="h-4 w-4" />Download</Button>
                      <button onClick={handleClose} className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-zinc-500"><X className="h-5 w-5" /></button>
                    </div>
                  </div>

                  <video ref={videoRef} src={activeVideo.url} controls autoPlay playsInline className="w-full rounded-2xl bg-black aspect-video border border-white/[0.06]" />

                  {/* Session Insights Panel */}
                  {linkedSession && <SessionInsightsPanel session={linkedSession} />}
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {recordings.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-2xl glass-card flex items-center justify-center mb-6">
              <Video className="h-10 w-10 text-zinc-700" strokeWidth={1.25} />
            </div>
            <h2 className="text-xl font-bold text-zinc-400 mb-2">No Recordings Yet</h2>
            <p className="text-sm text-zinc-600 max-w-md">Open a workout and tap Record to capture a set. Your clips with AI insights show up here.</p>
          </GlassCard>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {recordings.map((rec, i) => {
              const recSession = getSessions().find(s => s.recordingId === rec.id || s.id === rec.sessionId);
              const hasPerfect = recSession ? (recSession.bestRepScore ?? 0) >= 90 : false;
              return (
              <motion.div key={rec.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="h-full p-5 flex flex-col group hover:bg-white/[0.03] transition-all duration-300">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold truncate text-zinc-100 flex items-center gap-2">
                        {rec.exerciseName}
                        {hasPerfect && <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 font-bold uppercase"><Flame className="h-2.5 w-2.5" />Perfect</span>}
                      </h3>
                      <p className="text-xs text-zinc-600">{new Date(rec.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Badge variant={scoreBadgeVariant(rec.score)} className="font-mono tabular-nums text-[11px]">{rec.score}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ icon: Repeat, label: "Reps", value: rec.reps }, { icon: Clock, label: "Time", value: formatDuration(rec.duration) }, { icon: Target, label: "Size", value: formatSize(rec.size) }].map(s => (
                      <div key={s.label} className="glass-card rounded-lg px-2.5 py-2">
                        <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 flex items-center gap-1 mb-0.5"><s.icon className="h-3 w-3" />{s.label}</div>
                        <div className="font-semibold text-sm text-zinc-300 tabular-nums">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <button onClick={() => handlePlay(rec)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 py-2.5 text-sm font-bold text-white transition-all hover:shadow-[0_0_24px_-4px_rgba(6,182,212,0.3)] active:scale-[0.98]">
                      <Play className="h-4 w-4 fill-current" /> Watch + Insights
                    </button>
                    <Button variant="outline" size="sm" className="min-h-[40px] px-3 border-white/[0.08] bg-white/[0.02]" onClick={() => handleDownload(rec)}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="min-h-[40px] px-3 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleDelete(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </GlassCard>
              </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function computePerfectReasons(reps: { score: number; issues: { message?: string }[]; issueCount?: number }[], bestIdx: number): PerfectRepReason[] {
  if (bestIdx < 0 || bestIdx >= reps.length) return [];
  const rep = reps[bestIdx];
  const reasons: PerfectRepReason[] = [];
  if (rep.score >= 90) reasons.push("high_score");
  if (rep.issues.length === 0) reasons.push("zero_issues");
  if ((rep.issueCount ?? rep.issues.length) === 0 && rep.score >= 85) reasons.push("full_rom");
  if (rep.score >= 95) reasons.push("stable_form");
  if (bestIdx > 0 && Math.abs(rep.score - reps[bestIdx - 1].score) <= 5 && rep.score >= 80) reasons.push("consistent_tempo");
  return reasons;
}

function SessionInsightsPanel({ session }: { session: WorkoutSession }) {
  const [showWhyExplanations, setShowWhyExplanations] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<FormExplanation[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [hasLoadedAI, setHasLoadedAI] = useState(false);

  const { reps, exercise, totalScore } = session;
  const bestIdx = session.bestRepIndex ?? (reps.length > 0 ? reps.reduce((b, r, i) => (r.score > reps[b].score ? i : b), 0) : -1);
  const bestScore = bestIdx >= 0 ? reps[bestIdx].score : 0;
  const chartData = reps.map((r, i) => ({ rep: i + 1, score: r.score }));
  const allIssues = reps.flatMap(r => r.issues);
  const syncExplanations = getExplanationsForIssues(allIssues, exercise);
  const explanations = aiExplanations.length > 0 ? aiExplanations : syncExplanations;

  const issueCounts: Record<string, number> = {};
  for (const iss of allIssues) if (iss.message) issueCounts[iss.message] = (issueCounts[iss.message] || 0) + 1;
  const topMistakes = Object.entries(issueCounts).sort(([, a], [, b]) => b - a).slice(0, 4);

  const TT: React.CSSProperties = { background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "11px" };

  const handleExplainClick = async () => {
    const next = !showWhyExplanations;
    setShowWhyExplanations(next);
    if (next && !hasLoadedAI) {
      setLoadingAI(true);
      try {
        const results = await generateFormExplanations(allIssues, exercise);
        setAiExplanations(results);
      } catch { /* fallback already showing */ }
      finally { setLoadingAI(false); setHasLoadedAI(true); }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        <h4 className="text-sm font-bold text-zinc-300">Session Insights</h4>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Reps", value: reps.length, icon: Repeat },
          { label: "Avg", value: totalScore, icon: Target, cls: totalScore >= 85 ? "text-emerald-400" : totalScore >= 65 ? "text-amber-400" : "text-rose-400" },
          { label: "Best", value: bestScore, icon: Star, cls: bestScore >= 90 ? "text-amber-400" : "text-zinc-300" },
          { label: "Issues", value: topMistakes.length, icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-lg px-2.5 py-2 text-center">
            <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600 flex items-center justify-center gap-1 mb-1"><s.icon className="h-3 w-3" />{s.label}</div>
            <div className={cn("text-base font-black tabular-nums", s.cls)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Best rep highlight with reasons */}
      {bestScore >= 85 && (
        <div className={cn(
          "rounded-lg border px-3 py-2.5",
          bestScore >= 90
            ? "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-amber-500/20"
            : "bg-emerald-500/[0.06] border-emerald-500/15"
        )}>
          <div className="flex items-center gap-2 mb-1.5">
            {bestScore >= 90
              ? <Crown className="h-4 w-4 text-amber-400" />
              : <Star className="h-4 w-4 text-emerald-400" />}
            <span className={cn("text-xs font-bold", bestScore >= 90 ? "text-amber-300" : "text-emerald-300")}>
              {bestScore >= 90 ? "Perfect" : "Best"} Rep #{bestIdx + 1} — Score {bestScore}
            </span>
          </div>
          {(() => {
            const reasons = session.bestRepReasons || computePerfectReasons(reps, bestIdx);
            const display = reasons.filter((r: PerfectRepReason) => r in PERFECT_REP_REASON_LABELS).slice(0, 3);
            if (display.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1 mt-1">
                {display.map((r: PerfectRepReason) => (
                  <span key={r} className="inline-flex items-center gap-0.5 text-[9px] font-semibold rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-zinc-400">
                    <CheckCircle2 className="h-2 w-2" />{PERFECT_REP_REASON_LABELS[r]}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Score timeline */}
      {chartData.length > 1 && (
        <div>
          <h5 className="text-xs font-bold text-zinc-500 mb-2">Score Timeline</h5>
          <GlassCard className="p-3"><div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="rep" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} width={24} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${v ?? "—"}`, "Score"]} labelFormatter={(l) => `Rep ${l}`} />
                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 2, strokeWidth: 0 }} />
                {bestIdx >= 0 && (
                  <ReferenceDot x={bestIdx + 1} y={bestScore} r={5} fill="#f59e0b" stroke="#030305" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div></GlassCard>
        </div>
      )}

      {/* Mistakes */}
      {topMistakes.length > 0 && (
        <div className="space-y-1.5">
          <h5 className="text-xs font-bold text-zinc-500">Detected Mistakes</h5>
          {topMistakes.map(([mistake, count]) => (
            <div key={mistake} className="flex items-center justify-between glass-card rounded-lg px-3 py-2">
              <span className="text-xs text-amber-200 truncate mr-2">{mistake}</span>
              <span className="text-[10px] font-bold tabular-nums text-amber-400 shrink-0">{count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Explanations */}
      {explanations.length > 0 && (
        <div>
          <button
            onClick={handleExplainClick}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors mb-2"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {showWhyExplanations ? "Hide AI Explanations" : "Explain My Form"}
            {loadingAI && <Loader2 className="h-3 w-3 animate-spin text-cyan-500" />}
          </button>
          <AnimatePresence>
            {showWhyExplanations && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2.5 overflow-hidden">
                {explanations.map((exp, i) => (
                  <motion.div key={exp.title + i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard className="p-0 overflow-hidden">
                      <div className="h-[2px] bg-gradient-to-r from-cyan-500/60 via-blue-500/40 to-transparent" />
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                          </div>
                          <h5 className="text-xs font-bold text-zinc-200">{exp.title}</h5>
                        </div>
                        <div className="flex items-start gap-2 pl-0.5">
                          <Lightbulb className="h-3 w-3 mt-0.5 text-cyan-400 shrink-0" />
                          <p className="text-[12px] text-zinc-400 leading-relaxed">{exp.explanation}</p>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-3 py-2">
                          <Wrench className="h-3 w-3 mt-0.5 text-emerald-400 shrink-0" />
                          <p className="text-[12px] text-emerald-300/90 leading-relaxed">{exp.fixTip}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
