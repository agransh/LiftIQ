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
    <div className="absolute inset-0 z-15 pointer-events-none">
      <AnimatedSkeleton guide={guide} ghost />
      <button
        onClick={onDismiss}
        className="pointer-events-auto absolute top-12 left-3 h-9 w-9 rounded-full bg-black/70 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center text-purple-300 hover:text-white hover:bg-black/90 transition-all active:scale-90"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute bottom-3 right-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          Ghost Coach
        </span>
      </div>
    </div>
  );
}
