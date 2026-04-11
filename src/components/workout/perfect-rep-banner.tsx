"use client";

import { useEffect } from "react";
import { useWorkoutStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

export function PerfectRepBanner() {
  const { perfectRepAchieved, bestRepScore, dismissPerfectRep } = useWorkoutStore();

  useEffect(() => {
    if (!perfectRepAchieved) return;
    const timer = setTimeout(dismissPerfectRep, 3000);
    return () => clearTimeout(timer);
  }, [perfectRepAchieved, dismissPerfectRep]);

  return (
    <AnimatePresence>
      {perfectRepAchieved && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 border border-amber-500/30 backdrop-blur-xl px-6 py-3 shadow-[0_0_40px_-8px_rgba(245,158,11,0.3)]">
            <Flame className="h-6 w-6 text-amber-400 animate-pulse" />
            <div>
              <div className="text-sm font-black text-amber-300 tracking-tight">Perfect Rep!</div>
              <div className="text-xs text-amber-400/70 tabular-nums">Score: {bestRepScore}/100</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
