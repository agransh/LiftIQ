"use client";

import { useWorkoutStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AICoachBadge() {
  const { isWorkoutActive, settings } = useWorkoutStore();

  return (
    <AnimatePresence>
      {isWorkoutActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/20 px-3 py-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-300">
            Live AI Coach {settings.voiceEnabled ? "· Voice On" : ""}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
