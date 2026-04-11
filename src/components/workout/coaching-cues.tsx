"use client";

import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

export function CoachingCues() {
  const { currentCues, currentIssues, isWorkoutActive } = useWorkoutStore();

  if (!isWorkoutActive) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <MessageCircle className="h-4 w-4 text-zinc-600" />
          <h3 className="text-sm font-bold text-zinc-500">AI Coaching</h3>
        </div>
        <p className="text-sm text-zinc-600">Start a workout to receive live coaching cues.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-zinc-200">Live Coaching</h3>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-40" />
          <span className="relative h-2 w-2 rounded-full bg-cyan-400" />
        </span>
      </div>

      {currentCues.length === 0 && currentIssues.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl glass-card px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Looking great — keep it up!
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {currentCues.map((cue, i) => {
              const positive = cue.includes("Good") || cue.includes("Great");
              return (
                <motion.div
                  key={`cue-${cue}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
                    positive ? "glass-card text-emerald-300" : "glass-card text-amber-200"
                  )}
                >
                  {positive ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />}
                  {cue}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </GlassCard>
  );
}
