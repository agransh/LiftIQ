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

interface ExerciseSelectorProps {
  onSelect?: () => void;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
  const { selectedExercise, setSelectedExercise, isWorkoutActive } = useWorkoutStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4 text-purple-400" strokeWidth={2} />
        <h3 className="text-sm font-semibold text-zinc-300">Choose Exercise</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-1.5 max-h-[240px] md:max-h-[280px] overflow-y-auto pr-1">
        {exerciseList.map((exercise) => {
          const Icon = exerciseIcons[exercise.id] || Dumbbell;
          const isSelected = selectedExercise === exercise.id;

          return (
            <button
              key={exercise.id}
              onClick={() => { if (!isWorkoutActive) { setSelectedExercise(exercise.id); onSelect?.(); } }}
              disabled={isWorkoutActive}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left min-h-[40px]",
                "bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700",
                isSelected && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                !isSelected && "text-zinc-400 hover:text-zinc-200",
                isWorkoutActive && "opacity-40 cursor-not-allowed hover:bg-zinc-950 hover:border-zinc-800"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-purple-400" : "text-zinc-600")} />
              <span className="truncate">{exercise.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
