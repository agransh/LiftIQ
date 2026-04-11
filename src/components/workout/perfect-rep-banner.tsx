"use client";

import { useEffect, useRef } from "react";
import { useWorkoutStore } from "@/lib/store";
import { PERFECT_REP_REASON_LABELS } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, CheckCircle2 } from "lucide-react";

const DISMISS_MS = 4500;

export function PerfectRepBanner() {
  const { perfectRepAchieved, bestRepScore, bestRepIndex, bestRepReasons, dismissPerfectRep } = useWorkoutStore();
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!perfectRepAchieved) return;
    const timer = setTimeout(dismissPerfectRep, DISMISS_MS);

    // Short celebratory chime via Web Audio — two quick ascending tones
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;
      const play = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      play(880, 0, 0.15);
      play(1320, 0.1, 0.2);
    } catch {
      // Audio not available — visual celebration only
    }

    return () => clearTimeout(timer);
  }, [perfectRepAchieved, dismissPerfectRep]);

  const reasons = bestRepReasons.filter((r) => r in PERFECT_REP_REASON_LABELS).slice(0, 3);

  return (
    <AnimatePresence>
      {perfectRepAchieved && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", damping: 18, stiffness: 280 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          {/* Expanding glow ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-2xl"
          />

          <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-rose-500/15 border border-amber-400/30 backdrop-blur-2xl px-6 py-4 shadow-[0_0_60px_-10px_rgba(245,158,11,0.4)]">
            {/* Shimmer sweep */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] rounded-2xl pointer-events-none"
            />

            <div className="relative flex items-center gap-4">
              {/* Animated fire icon with pulse ring */}
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: 3, duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-amber-500/30 blur-md"
                />
                <motion.div
                  animate={{ rotate: [0, -8, 8, 0] }}
                  transition={{ repeat: 3, duration: 0.4 }}
                >
                  <Flame className="h-8 w-8 text-amber-400 relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                </motion.div>
              </div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-base font-black text-amber-200 tracking-tight"
                >
                  Perfect Rep!
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mt-0.5"
                >
                  <span className="text-sm font-bold text-amber-300/90 tabular-nums">
                    Rep #{bestRepIndex + 1} — {bestRepScore}/100
                  </span>
                </motion.div>

                {/* Reasons pills */}
                {reasons.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-1.5 mt-2"
                  >
                    {reasons.map((reason, i) => (
                      <motion.span
                        key={reason}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300/80"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {PERFECT_REP_REASON_LABELS[reason]}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
