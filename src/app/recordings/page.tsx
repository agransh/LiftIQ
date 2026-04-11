"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllRecordingsMeta, getRecordingBlob, deleteRecording, type RecordingMeta } from "@/lib/storage/recordings-db";
import { Video, Play, Trash2, X, Clock, Target, Repeat, Download } from "lucide-react";

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const scoreBadgeVariant = (s: number) => s >= 85 ? "success" : s >= 65 ? "warning" : "destructive";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ meta: RecordingMeta; url: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadRecordings = async () => { setRecordings(await getAllRecordingsMeta()); };
  useEffect(() => {
    queueMicrotask(() => {
      void loadRecordings();
    });
  }, []);
  useEffect(() => { if (!activeVideo) return; const p = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = p; }; }, [activeVideo]);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveVideo(v => { if (v) URL.revokeObjectURL(v.url); return null; }); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, []);

  const handlePlay = async (m: RecordingMeta) => { if (activeVideo) URL.revokeObjectURL(activeVideo.url); const b = await getRecordingBlob(m.id); if (b) setActiveVideo({ meta: m, url: URL.createObjectURL(b) }); };
  const handleClose = () => { if (activeVideo) { URL.revokeObjectURL(activeVideo.url); setActiveVideo(null); } };
  const handleDelete = async (id: string) => { await deleteRecording(id); if (activeVideo?.meta.id === id) handleClose(); loadRecordings(); };
  const handleDownload = async (m: RecordingMeta) => { const b = await getRecordingBlob(m.id); if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `LiftIQ-${m.exerciseName}-${new Date(m.createdAt).toISOString().slice(0, 10)}.webm`; a.click(); URL.revokeObjectURL(u); };

  return (
    <div className="min-h-[100dvh] has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Performance Library</h1>
          <p className="text-zinc-500 mt-2">Review and download your recorded sessions</p>
        </motion.div>

        {/* Video modal */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
              <motion.div className="w-full max-w-3xl" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} transition={{ type: "spring" as const, stiffness: 400, damping: 30 }} onClick={(e) => e.stopPropagation()}>
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
            <p className="text-sm text-zinc-600 max-w-md">Open a workout and tap Record to capture a set. Your clips show up here.</p>
          </GlassCard>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {recordings.map((rec, i) => (
              <motion.div key={rec.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="h-full p-5 flex flex-col group hover:bg-white/[0.03] transition-all duration-300">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold truncate text-zinc-100">{rec.exerciseName}</h3>
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
                      <Play className="h-4 w-4 fill-current" /> Watch
                    </button>
                    <Button variant="outline" size="sm" className="min-h-[40px] px-3 border-white/[0.08] bg-white/[0.02]" onClick={() => handleDownload(rec)}><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="min-h-[40px] px-3 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleDelete(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
