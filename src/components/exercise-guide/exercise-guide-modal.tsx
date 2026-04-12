"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSkeleton } from "./animated-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import type { ExerciseVisualGuide } from "@/lib/exercises/exercise-visual-guides";
import {
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Footprints,
  MessageCircle,
  Ghost,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseGuideModalProps {
  guide: ExerciseVisualGuide;
  onClose: () => void;
  onEnableGhostCoach?: () => void;
}

type Tab = "steps" | "mistakes" | "cues";

const difficultyColors: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export function ExerciseGuideModal({ guide, onClose, onEnableGhostCoach }: ExerciseGuideModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("steps");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "steps", label: "Steps", icon: <Footprints className="h-3.5 w-3.5" /> },
    { id: "mistakes", label: "Mistakes", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { id: "cues", label: "Coach Cues", icon: <MessageCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-md overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl my-4 sm:my-8 mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard elevated className="rounded-3xl overflow-hidden">
            {/* accent bar */}
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

            <div className="p-5 sm:p-6">
              {/* header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/10 flex items-center justify-center">
                      <Dumbbell className="h-4.5 w-4.5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight">{guide.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-bold uppercase tracking-wider border", difficultyColors[guide.difficulty])}
                        >
                          {guide.difficulty}
                        </Badge>
                        <span className="text-[11px] text-zinc-500">{guide.muscles.join(" · ")}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">{guide.description}</p>
                </div>
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/[0.06] text-zinc-500 transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* animated skeleton */}
              <div className="relative rounded-2xl bg-[#050508] border border-white/[0.04] overflow-hidden mb-5">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
                <div className="aspect-[16/10] sm:aspect-[16/9]">
                  <AnimatedSkeleton guide={guide} />
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    ANIMATED
                  </span>
                </div>
              </div>

              {/* ghost coach CTA */}
              {onEnableGhostCoach && (
                <button
                  onClick={() => {
                    onEnableGhostCoach();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-purple-500/[0.08] to-cyan-500/[0.08] border border-purple-500/15 px-4 py-3 mb-5 group hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <Ghost className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-zinc-200">Ghost Coach</div>
                      <div className="text-[11px] text-zinc-500">Show ideal form overlay on your camera</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                </button>
              )}

              {/* tab bar */}
              <div className="flex gap-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-1 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all",
                      activeTab === tab.id
                        ? "bg-white/[0.06] text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === "steps" && <StepsPanel steps={guide.steps} />}
                  {activeTab === "mistakes" && <MistakesPanel mistakes={guide.commonMistakes} />}
                  {activeTab === "cues" && <CuesPanel cues={guide.coachingCues} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StepsPanel({ steps }: { steps: ExerciseVisualGuide["steps"] }) {
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3 glass-card rounded-xl px-4 py-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 text-xs font-black">
            {i + 1}
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-200 mb-0.5">{step.title}</div>
            <div className="text-xs text-zinc-500 leading-relaxed">{step.detail}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MistakesPanel({ mistakes }: { mistakes: ExerciseVisualGuide["commonMistakes"] }) {
  return (
    <div className="space-y-2.5">
      {mistakes.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="h-6 w-6 rounded-md bg-rose-500/10 border border-rose-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-3 w-3 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-rose-300 mb-1">{m.mistake}</div>
                <div className="flex items-start gap-2 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/10 px-3 py-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-300/90 leading-relaxed">{m.fix}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

function CuesPanel({ cues }: { cues: string[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {cues.map((cue, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2.5 glass-card rounded-xl px-4 py-3"
        >
          <MessageCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-300">{cue}</span>
        </motion.div>
      ))}
    </div>
  );
}
