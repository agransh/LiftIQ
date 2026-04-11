"use client";

import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CoachingCues() {
  const { currentCues, currentIssues, isWorkoutActive } = useWorkoutStore();

  if (!isWorkoutActive) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-3 mb-3">
          <MessageCircle className="h-4 w-4 text-zinc-600" />
          <h3 className="text-sm font-semibold text-zinc-500">AI Coaching</h3>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Start a workout to receive live AI coaching cues.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold">Live Coaching</h3>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-40" />
          <span className="relative h-2 w-2 rounded-full bg-purple-400" />
        </span>
      </div>

      {currentCues.length === 0 && currentIssues.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl bg-green-500/5 border border-green-500/10 px-4 py-3 text-sm text-green-400">
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
                    "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm border",
                    positive
                      ? "bg-green-500/5 border-green-500/10 text-green-400"
                      : "bg-amber-500/5 border-amber-500/10 text-amber-300"
                  )}
                >
                  {positive
                    ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-400" />
                    : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                  }
                  {cue}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
