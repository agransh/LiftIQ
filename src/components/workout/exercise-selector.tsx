"use client";

import { useWorkoutStore } from "@/lib/store";
import { exerciseList } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import {
  Dumbbell,
  ArrowDownCircle,
  StretchVertical,
  Timer,
  PersonStanding,
  Zap,
  Mountain,
  ArrowUpCircle,
  CircleDot,
  Flame,
} from "lucide-react";

const exerciseIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  squat: ArrowDownCircle,
  pushup: Dumbbell,
  lunge: PersonStanding,
  plank: Timer,
  situp: StretchVertical,
  "jumping-jack": Zap,
  "mountain-climber": Mountain,
  "shoulder-press": ArrowUpCircle,
  "bicep-curl": CircleDot,
  burpee: Flame,
};

interface ExerciseSelectorProps {
  onSelect?: () => void;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
  const { selectedExercise, setSelectedExercise, isWorkoutActive } =
    useWorkoutStore();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1 hidden md:block">Exercise</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-1.5 max-h-[240px] md:max-h-[280px] overflow-y-auto pr-1 py-2 md:py-0">
        {exerciseList.map((exercise) => {
          const Icon = exerciseIcons[exercise.id] || Dumbbell;
          const isSelected = selectedExercise === exercise.id;

          return (
            <button
              key={exercise.id}
              onClick={() => {
                if (!isWorkoutActive) {
                  setSelectedExercise(exercise.id);
                  onSelect?.();
                }
              }}
              disabled={isWorkoutActive}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-3 md:py-2.5 text-sm font-medium transition-all text-left min-h-[44px]",
                isSelected
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent active:bg-secondary",
                isWorkoutActive && "opacity-50 cursor-not-allowed"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{exercise.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
