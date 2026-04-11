"use client";

import { useWorkoutStore } from "@/lib/store";
import { saveSession, updateStreak } from "@/lib/storage";
import { getExercise } from "@/lib/exercises";
import { WorkoutSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw, CircleDot } from "lucide-react";

export function WorkoutControls() {
  const {
    isWorkoutActive,
    isPaused,
    isRecording,
    selectedExercise,
    sessionStartTime,
    sessionWeight,
    repResults,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    clearRepResults,
    setLastSession,
    setRepCount,
    setCurrentScore,
    setCurrentCues,
    setCurrentIssues,
    setCurrentPhase,
  } = useWorkoutStore();

  const handleStart = () => {
    clearRepResults();
    startWorkout();
  };

  const handleStop = async () => {
    const config = getExercise(selectedExercise);
    const now = Date.now();
    const totalScore =
      repResults.length > 0
        ? Math.round(
            repResults.reduce((s, r) => s + r.score, 0) / repResults.length
          )
        : 0;

    const caloriesBurned = repResults.length * (config?.caloriesPerRep || 0.3);

    const session: WorkoutSession = {
      id: `session-${now}`,
      exercise: selectedExercise,
      exerciseName: config?.name || selectedExercise,
      weight: sessionWeight,
      startTime: sessionStartTime || now,
      endTime: now,
      reps: repResults,
      totalScore,
      caloriesBurned: Math.round(caloriesBurned * 10) / 10,
      isRecorded: isRecording,
    };

    saveSession(session);
    await updateStreak();

    setLastSession(session);
    stopWorkout();
  };

  const handleReset = () => {
    clearRepResults();
    setRepCount(0);
    setCurrentScore(100);
    setCurrentCues([]);
    setCurrentIssues([]);
    setCurrentPhase("");
    stopWorkout();
    setLastSession(null);
  };

  return (
    <div className="flex items-center gap-2">
      {!isWorkoutActive ? (
        <>
          <Button onClick={handleStart} size="lg" className="flex-1 min-h-[48px]">
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg" className="min-h-[48px]">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 shrink-0">
              <CircleDot className="h-3.5 w-3.5 text-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">REC</span>
            </div>
          )}
          {isPaused ? (
            <Button onClick={resumeWorkout} size="lg" className="flex-1 min-h-[48px]">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button
              onClick={pauseWorkout}
              variant="secondary"
              size="lg"
              className="flex-1 min-h-[48px]"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={handleStop} variant="destructive" size="lg" className="min-h-[48px]">
            <Square className="h-4 w-4" />
            End
          </Button>
        </>
      )}
    </div>
  );
}
