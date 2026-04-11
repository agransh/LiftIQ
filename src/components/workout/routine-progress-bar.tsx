"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RestTimer } from "@/components/workout/rest-timer";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutRoutine, RoutineExercise } from "@/types";

export interface RoutineProgressState {
  routine: WorkoutRoutine;
  exerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  completed: boolean;
}

interface RoutineProgressBarProps {
  routineProgress: RoutineProgressState | null;
  onExit: () => void;
  onSetComplete: () => void;
  onRestComplete: () => void;
  onSkipRest: () => void;
}

export function RoutineProgressBar({
  routineProgress,
  onExit,
  onSetComplete,
  onRestComplete,
  onSkipRest,
}: RoutineProgressBarProps) {
  if (!routineProgress) return null;
  const { routine, exerciseIndex, currentSet, isResting, completed } = routineProgress;
  const totalExercises = routine.exercises.length;
  const currentEx: RoutineExercise | undefined = routine.exercises[exerciseIndex];

  if (completed) {
    return (
      <GlassCard className="border-emerald-500/20 bg-emerald-500/[0.06]">
        <div className="p-3 text-center">
          <div className="text-sm font-semibold text-emerald-400">Routine Complete!</div>
          <div className="text-xs text-zinc-500 mt-1">{routine.name}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="mt-2 border-white/[0.08] bg-white/[0.02]"
          >
            Done
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="border-cyan-500/15">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500">{routine.name}</div>
            <div className="text-sm font-semibold text-zinc-100">
              {currentEx?.name}
              {currentEx?.weight && <span className="text-zinc-500 ml-1">@ {currentEx.weight} lbs</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-white/[0.08]">
              {exerciseIndex + 1}/{totalExercises}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onExit} className="h-7 w-7 text-zinc-500">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1">
          {routine.exercises.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < exerciseIndex
                  ? "bg-cyan-500"
                  : i === exerciseIndex
                    ? "bg-cyan-500/60"
                    : "bg-white/[0.06]",
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            Set {currentSet} of {currentEx?.targetSets} · {currentEx?.targetReps} reps
          </span>
          {!isResting && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetComplete}
              className="h-7 text-xs gap-1 border-white/[0.08] bg-white/[0.02]"
            >
              <Clock className="h-3 w-3" />
              Set Done
            </Button>
          )}
        </div>

        {isResting && currentEx && (
          <RestTimer
            initialSeconds={currentEx.restAfterSets}
            onComplete={onRestComplete}
            onSkip={onSkipRest}
            label={`Rest — Next: Set ${currentSet < currentEx.targetSets ? currentSet + 1 : 1}${
              currentSet >= currentEx.targetSets && exerciseIndex + 1 < totalExercises
                ? ` of ${routine.exercises[exerciseIndex + 1].name}`
                : ""
            }`}
          />
        )}
      </div>
    </GlassCard>
  );
}
