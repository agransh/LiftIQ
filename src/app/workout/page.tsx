"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WebcamFeed } from "@/components/workout/webcam-feed";
import { ExerciseSelector } from "@/components/workout/exercise-selector";
import { WorkoutControls } from "@/components/workout/workout-controls";
import { LiveMetrics } from "@/components/workout/live-metrics";
import { CoachingCues } from "@/components/workout/coaching-cues";
import { MobileWorkoutHUD } from "@/components/workout/mobile-hud";
import { PostWorkoutSummary } from "@/components/workout/post-workout-summary";
import { ExerciseManager } from "@/components/workout/exercise-manager";
import { RoutineBuilder } from "@/components/workout/routine-builder";
import { RestTimer } from "@/components/workout/rest-timer";
import { useWorkoutStore } from "@/lib/store";
import { hasCompletedOnboarding, fetchHasCompletedOnboarding } from "@/lib/storage";
import { UserExercise, WorkoutRoutine, RoutineExercise } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ChevronDown, ChevronUp, ListPlus, Video, LayoutList, Clock, X, SkipForward } from "lucide-react";

interface RoutineProgress {
  routine: WorkoutRoutine;
  exerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  completed: boolean;
}

export default function WorkoutPage() {
  const router = useRouter();
  const {
    lastSession,
    selectedExercise,
    isWorkoutActive,
    setSelectedExercise,
    setSessionWeight,
    startWorkout,
  } = useWorkoutStore();
  const [showExercises, setShowExercises] = useState(false);
  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [selectedUserExercise, setSelectedUserExercise] = useState<UserExercise | null>(null);

  // Routine mode state
  const [routineProgress, setRoutineProgress] = useState<RoutineProgress | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasCompletedOnboarding()) {
      fetchHasCompletedOnboarding().then((done) => {
        if (!done) router.push("/onboarding");
      });
    }
  }, [router]);

  const exerciseName = selectedUserExercise?.name || selectedExercise
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const handleSelectUserExercise = (ex: UserExercise) => {
    setSelectedUserExercise(ex);
    if (ex.trackingId !== "custom") {
      setSelectedExercise(ex.trackingId);
    }
    if (ex.weight) {
      setSessionWeight(ex.weight);
    }
  };

  const handleRecordWorkout = () => {
    startWorkout(true);
  };

  // --- Routine flow ---
  const handleStartRoutine = (routine: WorkoutRoutine) => {
    if (routine.exercises.length === 0) return;
    const firstEx = routine.exercises[0];
    if (firstEx.trackingId !== "custom") {
      setSelectedExercise(firstEx.trackingId);
    }
    if (firstEx.weight) {
      setSessionWeight(firstEx.weight);
    }
    setRoutineProgress({
      routine,
      exerciseIndex: 0,
      currentSet: 1,
      isResting: false,
      completed: false,
    });
  };

  const currentRoutineExercise: RoutineExercise | null =
    routineProgress && !routineProgress.completed
      ? routineProgress.routine.exercises[routineProgress.exerciseIndex]
      : null;

  const handleSetComplete = useCallback(() => {
    if (!routineProgress || !currentRoutineExercise) return;
    const { exerciseIndex, currentSet, routine } = routineProgress;
    const ex = currentRoutineExercise;

    if (currentSet < ex.targetSets) {
      setRoutineProgress({
        ...routineProgress,
        isResting: true,
      });
    } else {
      // Move to next exercise
      const nextIdx = exerciseIndex + 1;
      if (nextIdx < routine.exercises.length) {
        const nextEx = routine.exercises[nextIdx];
        if (nextEx.trackingId !== "custom") {
          setSelectedExercise(nextEx.trackingId);
        }
        if (nextEx.weight) {
          setSessionWeight(nextEx.weight);
        }
        setRoutineProgress({
          ...routineProgress,
          exerciseIndex: nextIdx,
          currentSet: 1,
          isResting: true,
        });
      } else {
        setRoutineProgress({
          ...routineProgress,
          completed: true,
          isResting: false,
        });
      }
    }
  }, [routineProgress, currentRoutineExercise, setSelectedExercise, setSessionWeight]);

  const handleRestComplete = useCallback(() => {
    if (!routineProgress || !currentRoutineExercise) return;
    const { currentSet } = routineProgress;
    const ex = currentRoutineExercise;

    if (currentSet < ex.targetSets) {
      setRoutineProgress({
        ...routineProgress,
        currentSet: currentSet + 1,
        isResting: false,
      });
    } else {
      setRoutineProgress({
        ...routineProgress,
        isResting: false,
      });
    }
  }, [routineProgress, currentRoutineExercise]);

  const handleSkipRest = useCallback(() => {
    handleRestComplete();
  }, [handleRestComplete]);

  const exitRoutine = () => {
    setRoutineProgress(null);
  };

  // Routine progress bar component
  const RoutineProgressBar = () => {
    if (!routineProgress) return null;
    const { routine, exerciseIndex, currentSet, isResting, completed } = routineProgress;
    const totalExercises = routine.exercises.length;
    const currentEx = routine.exercises[exerciseIndex];

    if (completed) {
      return (
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <div className="text-sm font-semibold text-emerald-400">Routine Complete!</div>
            <div className="text-xs text-muted-foreground mt-1">{routine.name}</div>
            <Button variant="outline" size="sm" onClick={exitRoutine} className="mt-2">
              Done
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{routine.name}</div>
              <div className="text-sm font-semibold">
                {currentEx?.name}
                {currentEx?.weight && <span className="text-muted-foreground ml-1">@ {currentEx.weight} lbs</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {exerciseIndex + 1}/{totalExercises}
              </Badge>
              <Button variant="ghost" size="icon" onClick={exitRoutine} className="h-7 w-7">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1">
            {routine.exercises.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < exerciseIndex ? "bg-primary" : i === exerciseIndex ? "bg-primary/60" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Set {currentSet} of {currentEx?.targetSets} · {currentEx?.targetReps} reps
            </span>
            {!isResting && (
              <Button variant="outline" size="sm" onClick={handleSetComplete} className="h-7 text-xs gap-1">
                <Clock className="h-3 w-3" />
                Set Done
              </Button>
            )}
          </div>

          {isResting && currentEx && (
            <RestTimer
              initialSeconds={currentEx.restAfterSets}
              onComplete={handleRestComplete}
              onSkip={handleSkipRest}
              label={`Rest — Next: Set ${currentSet < currentEx.targetSets ? currentSet + 1 : 1}${
                currentSet >= currentEx.targetSets && exerciseIndex + 1 < totalExercises
                  ? ` of ${routine.exercises[exerciseIndex + 1].name}`
                  : ""
              }`}
            />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden flex flex-col h-[100dvh]">
        <div className="relative flex-1 min-h-0">
          <WebcamFeed mobile />
          <MobileWorkoutHUD />
          <MobileCoachingToast />
        </div>

        <div className="shrink-0 bg-background border-t border-border/50 overflow-y-auto max-h-[50vh]"
          style={{ paddingBottom: "calc(4rem + var(--safe-bottom))" }}
        >
          {/* Routine progress */}
          {routineProgress && (
            <div className="px-4 pt-3">
              <RoutineProgressBar />
            </div>
          )}

          {/* Exercise info + pickers */}
          {!isWorkoutActive && !routineProgress?.isResting && (
            <>
              <div className="flex items-center gap-2 px-4 pt-3">
                <button
                  onClick={() => setShowExercises(!showExercises)}
                  className="flex-1 flex items-center justify-between py-2 text-sm font-medium text-muted-foreground active:text-foreground"
                >
                  <span>
                    Exercise: <span className="text-foreground">{exerciseName}</span>
                    {selectedUserExercise?.weight && (
                      <span className="text-muted-foreground ml-1">
                        @ {selectedUserExercise.weight} lbs
                      </span>
                    )}
                  </span>
                  {showExercises ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRoutineBuilder(true)}
                  className="min-h-[36px]"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExerciseManager(true)}
                  className="min-h-[36px]"
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  My
                </Button>
              </div>

              {showExercises && (
                <div className="px-4 pb-2 border-t border-border/30 mt-1">
                  <ExerciseSelector onSelect={() => {
                    setShowExercises(false);
                    setSelectedUserExercise(null);
                  }} />
                </div>
              )}
            </>
          )}

          {/* Controls */}
          {!routineProgress?.isResting && (
            <div className="px-4 py-3 flex gap-2">
              <div className="flex-1">
                <WorkoutControls />
              </div>
              {!isWorkoutActive && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRecordWorkout}
                  className="min-h-[48px] gap-1.5"
                  title="Record workout with form analysis"
                >
                  <Video className="h-4 w-4 text-red-400" />
                  <span className="hidden sm:inline">Record</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Workout
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {routineProgress && !routineProgress.completed
                  ? `${routineProgress.routine.name} — ${currentRoutineExercise?.name}`
                  : `${exerciseName}${selectedUserExercise?.weight ? ` @ ${selectedUserExercise.weight} lbs` : ""} — Position yourself in the camera frame`
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoutineBuilder(true)}
              >
                <LayoutList className="h-4 w-4" />
                Routines
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExerciseManager(true)}
              >
                <ListPlus className="h-4 w-4" />
                My Exercises
              </Button>
              {!isWorkoutActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecordWorkout}
                >
                  <Video className="h-4 w-4 text-red-400" />
                  Record Workout
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_340px] gap-6">
            <div className="space-y-4">
              <WebcamFeed />
              <CoachingCues />
            </div>
            <div className="space-y-4">
              {routineProgress && <RoutineProgressBar />}
              {!routineProgress && <ExerciseSelector onSelect={() => setSelectedUserExercise(null)} />}
              <WorkoutControls />
              <LiveMetrics />
            </div>
          </div>
        </div>
      </div>

      {lastSession && <PostWorkoutSummary />}
      {showExerciseManager && (
        <ExerciseManager
          onClose={() => setShowExerciseManager(false)}
          onSelectExercise={handleSelectUserExercise}
        />
      )}
      {showRoutineBuilder && (
        <RoutineBuilder
          onClose={() => setShowRoutineBuilder(false)}
          onStartRoutine={handleStartRoutine}
        />
      )}
    </div>
  );
}

function MobileCoachingToast() {
  const { currentCues, isWorkoutActive } = useWorkoutStore();

  if (!isWorkoutActive || currentCues.length === 0) return null;

  const cue = currentCues[0];
  const isPositive = cue.includes("Good") || cue.includes("Great");

  return (
    <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
      <div
        className={`glass-card rounded-xl px-4 py-2.5 text-center text-sm font-medium ${
          isPositive ? "text-emerald-400" : "text-yellow-400"
        }`}
      >
        {isPositive ? "✓ " : "↑ "}
        {cue}
      </div>
    </div>
  );
}
