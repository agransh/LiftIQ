"use client";

import { AnimatedSkeleton } from "./animated-skeleton";
import { getExerciseGuide } from "@/lib/exercises/exercise-visual-guides";
import { X } from "lucide-react";

interface GhostCoachOverlayProps {
  exerciseId: string;
  onDismiss: () => void;
}

export function GhostCoachOverlay({ exerciseId, onDismiss }: GhostCoachOverlayProps) {
  const guide = getExerciseGuide(exerciseId);
  if (!guide) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      <AnimatedSkeleton guide={guide} ghost />
      <button
        onClick={onDismiss}
        className="pointer-events-auto absolute top-2 left-2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="pointer-events-none absolute bottom-2 right-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-purple-300">
          Ghost Coach
        </span>
      </div>
    </div>
  );
}
