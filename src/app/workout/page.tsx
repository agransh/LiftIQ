"use client";

import { useState, useEffect } from "react";
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
import { useWorkoutStore } from "@/lib/store";
import { hasCompletedOnboarding } from "@/lib/storage";
import { UserExercise } from "@/types";
import { Button } from "@/components/ui/button";
import { Activity, ChevronDown, ChevronUp, ListPlus, Video } from "lucide-react";

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
  const [selectedUserExercise, setSelectedUserExercise] = useState<UserExercise | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasCompletedOnboarding()) {
      router.push("/onboarding");
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

        <div className="shrink-0 bg-background border-t border-border/50"
          style={{ paddingBottom: "calc(4rem + var(--safe-bottom))" }}
        >
          {/* Exercise info + pickers */}
          {!isWorkoutActive && (
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
                {exerciseName}
                {selectedUserExercise?.weight && ` @ ${selectedUserExercise.weight} lbs`}
                {" — "}Position yourself in the camera frame
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              <ExerciseSelector onSelect={() => setSelectedUserExercise(null)} />
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
