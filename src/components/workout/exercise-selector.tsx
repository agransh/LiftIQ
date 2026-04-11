"use client";

import { useWorkoutStore } from "@/lib/store";
import { exerciseList } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import {
  Dumbbell, ArrowDownCircle, StretchVertical, Timer, PersonStanding,
  Zap, Mountain, ArrowUpCircle, CircleDot, Flame,
} from "lucide-react";

const exerciseIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  squat: ArrowDownCircle, pushup: Dumbbell, lunge: PersonStanding, plank: Timer,
  situp: StretchVertical, "jumping-jack": Zap, "mountain-climber": Mountain,
  "shoulder-press": ArrowUpCircle, "bicep-curl": CircleDot, burpee: Flame,
};

interface ExerciseSelectorProps { onSelect?: () => void; }

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
  const { selectedExercise, setSelectedExercise, isWorkoutActive } = useWorkoutStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4 text-cyan-400" strokeWidth={2} />
        <h3 className="text-sm font-bold text-zinc-200">Choose Exercise</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
        {exerciseList.map((exercise) => {
          const Icon = exerciseIcons[exercise.id] || Dumbbell;
          const sel = selectedExercise === exercise.id;
          return (
            <button
              key={exercise.id}
              onClick={() => { if (!isWorkoutActive) { setSelectedExercise(exercise.id); onSelect?.(); } }}
              disabled={isWorkoutActive}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left min-h-[40px]",
                "glass-card hover:bg-white/[0.03]",
                sel && "bg-cyan-500/[0.08] text-cyan-300 border-cyan-500/15 glow-sm",
                !sel && "text-zinc-400 hover:text-zinc-200",
                isWorkoutActive && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", sel ? "text-cyan-400" : "text-zinc-600")} />
              <span className="truncate">{exercise.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
