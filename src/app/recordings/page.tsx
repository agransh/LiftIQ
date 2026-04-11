"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAllRecordingsMeta, getRecordingBlob, deleteRecording, type RecordingMeta,
} from "@/lib/storage/recordings-db";
import { Video, Play, Trash2, X, Clock, Target, Repeat, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const formatDuration = (s: number) => { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, "0")}`; };
const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const scoreBadgeVariant = (score: number) => score >= 85 ? "success" : score >= 65 ? "warning" : "destructive";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ meta: RecordingMeta; url: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadRecordings = async () => { setRecordings(await getAllRecordingsMeta()); };
  useEffect(() => { loadRecordings(); }, []);
  useEffect(() => { if (!activeVideo) return; const prev = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = prev; }; }, [activeVideo]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key !== "Escape") return; setActiveVideo((v) => { if (!v) return v; URL.revokeObjectURL(v.url); return null; }); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);

  const handlePlay = async (meta: RecordingMeta) => { if (activeVideo) URL.revokeObjectURL(activeVideo.url); const blob = await getRecordingBlob(meta.id); if (blob) setActiveVideo({ meta, url: URL.createObjectURL(blob) }); };
  const handleClose = () => { if (activeVideo) { URL.revokeObjectURL(activeVideo.url); setActiveVideo(null); } };
  const handleDelete = async (id: string) => { await deleteRecording(id); if (activeVideo?.meta.id === id) handleClose(); loadRecordings(); };
  const handleDownload = async (meta: RecordingMeta) => { const blob = await getRecordingBlob(meta.id); if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `LiftIQ-${meta.exerciseName}-${new Date(meta.createdAt).toISOString().slice(0, 10)}.webm`; a.click(); URL.revokeObjectURL(url); };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 has-bottom-nav md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Recordings</h1>
          <p className="text-sm text-zinc-500 mt-1">Review your recorded sessions</p>
        </motion.div>

        <AnimatePresence>
          {activeVideo && (
            <motion.div
              role="dialog" aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClose}
            >
              <motion.div
                className="w-full max-w-3xl"
                initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold truncate">{activeVideo.meta.exerciseName}</h3>
                      <p className="text-xs text-zinc-500">{new Date(activeVideo.meta.createdAt).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={scoreBadgeVariant(activeVideo.meta.score)} className="font-mono tabular-nums">Score {activeVideo.meta.score}</Badge>
                        <span className="text-xs text-zinc-500"><Repeat className="h-3 w-3 inline mr-1" />{activeVideo.meta.reps} reps</span>
                        <span className="text-xs text-zinc-500"><Clock className="h-3 w-3 inline mr-1" />{formatDuration(activeVideo.meta.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400" onClick={() => handleDownload(activeVideo.meta)}>
                        <Download className="h-4 w-4" /> Download
                      </Button>
                      <button onClick={handleClose} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-500"><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <video ref={videoRef} src={activeVideo.url} controls autoPlay playsInline className="w-full rounded-xl bg-black aspect-video border border-zinc-800" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-6">
              <Video className="h-10 w-10 text-zinc-700" strokeWidth={1.25} />
            </div>
            <h2 className="text-xl font-bold text-zinc-400 mb-2">No Recordings Yet</h2>
            <p className="text-sm text-zinc-600 max-w-md">Open a workout and tap Record to capture a set. Clips show up here.</p>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {recordings.map((rec) => (
              <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-semibold truncate">{rec.exerciseName}</h3>
                      <p className="text-xs text-zinc-600">{new Date(rec.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Badge variant={scoreBadgeVariant(rec.score)} className="font-mono tabular-nums text-[11px]">{rec.score}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-zinc-500">
                    {[
                      { icon: Repeat, label: "Reps", value: rec.reps },
                      { icon: Clock, label: "Time", value: formatDuration(rec.duration) },
                      { icon: Target, label: "Size", value: formatSize(rec.size) },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-600 flex items-center gap-1 mb-0.5"><s.icon className="h-3 w-3" />{s.label}</div>
                        <div className="font-medium text-zinc-300 tabular-nums">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <Button size="sm" className="flex-1 min-h-[40px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0" onClick={() => handlePlay(rec)}>
                      <Play className="h-4 w-4 fill-current" /> Watch
                    </Button>
                    <Button variant="outline" size="sm" className="min-h-[40px] px-3 border-zinc-700 text-zinc-400" onClick={() => handleDownload(rec)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="min-h-[40px] px-3 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => handleDelete(rec.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
