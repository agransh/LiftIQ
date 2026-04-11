"use client";

import { useWorkoutStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export function AICoachBadge() {
  const { isWorkoutActive, settings, updateSettings, voiceState, voiceCurrentCue } = useWorkoutStore();

  if (!isWorkoutActive) return null;

  const voiceOn = settings.voiceEnabled;
  const isSpeaking = voiceState === "speaking";

  return (
    <div className="space-y-2">
      {/* Main badge */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/20 px-3 py-1.5">
          <Sparkles className={cn("h-3.5 w-3.5 text-cyan-400", isSpeaking && "animate-pulse")} />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-300">
            Live AI Coach
          </span>
          {isSpeaking && (
            <span className="flex gap-[2px] ml-1 items-end h-3">
              {[1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-[2px] bg-cyan-400 rounded-full"
                  animate={{ height: ["4px", "12px", "4px"] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Voice toggle */}
        <button
          onClick={() => updateSettings({ voiceEnabled: !voiceOn })}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all",
            voiceOn
              ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
              : "bg-white/[0.04] border border-white/[0.08] text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06]",
          )}
          title={voiceOn ? "Mute voice coach" : "Enable voice coach"}
        >
          {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Current cue subtitle */}
      <AnimatePresence mode="wait">
        {voiceOn && voiceCurrentCue && (
          <motion.div
            key={voiceCurrentCue}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-1.5"
          >
            <p className="text-[11px] text-zinc-400 truncate">
              <span className="text-cyan-500 mr-1.5">&#x275D;</span>
              {voiceCurrentCue}
              <span className="text-cyan-500 ml-1">&#x275E;</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
