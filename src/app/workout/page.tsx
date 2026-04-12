"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { WebcamFeed } from "@/components/workout/webcam-feed";
import { ExerciseCameraPlaceholder } from "@/components/workout/exercise-camera-placeholder";
import { ExerciseSelector } from "@/components/workout/exercise-selector";
import { WorkoutControls } from "@/components/workout/workout-controls";
import { LiveMetrics } from "@/components/workout/live-metrics";
import { CoachingCues } from "@/components/workout/coaching-cues";
import { MobileWorkoutHUD } from "@/components/workout/mobile-hud";
import { PostWorkoutSummary } from "@/components/workout/post-workout-summary";
import { PerfectRepBanner } from "@/components/workout/perfect-rep-banner";
import { AICoachBadge } from "@/components/workout/ai-coach-badge";
import { ExerciseManager } from "@/components/workout/exercise-manager";
import { RoutineBuilder } from "@/components/workout/routine-builder";
import {
  RoutineProgressBar,
  type RoutineProgressState,
} from "@/components/workout/routine-progress-bar";
import { useWorkoutStore } from "@/lib/store";
import { getExercise } from "@/lib/exercises";
import { hasCompletedOnboarding, fetchHasCompletedOnboarding } from "@/lib/storage";
import { UserExercise, WorkoutRoutine, RoutineExercise } from "@/types";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  ChevronDown,
  ChevronUp,
  ListPlus,
  Video,
  LayoutList,
  Zap,
  Radio,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getExerciseGuide } from "@/lib/exercises/exercise-visual-guides";
import { ExerciseGuideModal } from "@/components/exercise-guide/exercise-guide-modal";

export default function WorkoutPage() {
  const router = useRouter();
  const {
    lastSession,
    selectedExercise,
    isWorkoutActive,
    isRecording,
    isCountingDown,
    isFormChecking,
    sessionWeight,
    hasSelectedExercise,
    setSelectedExercise,
    setSessionWeight,
    setHasSelectedExercise,
    startCountdown,
    clearRepResults,
    setRecordingBlob,
  } = useWorkoutStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [showExerciseGuide, setShowExerciseGuide] = useState(false);
  const [ghostCoachEnabled, setGhostCoachEnabled] = useState(false);
  const [selectedUserExercise, setSelectedUserExercise] = useState<UserExercise | null>(null);
  const [routineProgress, setRoutineProgress] = useState<RoutineProgressState | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasCompletedOnboarding()) {
      fetchHasCompletedOnboarding().then((done) => {
        if (!done) router.push("/onboarding");
      });
    }
  }, [router]);

  /** e.g. /workout?exercise=pushup — pre-select exercise for rep testing */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("exercise");
    if (!raw) return;
    const id = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (getExercise(id)) {
      setSelectedExercise(id);
      setSelectedUserExercise(null);
    }
  }, [setSelectedExercise]);

  const exerciseName =
    selectedUserExercise?.name ||
    (selectedExercise
      ? selectedExercise
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Choose exercise");
  const weightLabel = selectedUserExercise?.weight ?? sessionWeight;

  const handleSelectUserExercise = (ex: UserExercise) => {
    setSelectedUserExercise(ex);
    setSelectedExercise(ex.trackingId);
    setHasSelectedExercise(true);
    if (ex.weight) setSessionWeight(ex.weight);
  };

  const handleStartRoutine = (routine: WorkoutRoutine) => {
    if (routine.exercises.length === 0) return;
    const firstEx = routine.exercises[0];
    setSelectedExercise(firstEx.trackingId);
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
    setHasSelectedExercise(true);
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

  const headerSubtitle = () => {
    if (routineProgress && !routineProgress.completed) {
      return `${routineProgress.routine.name} — ${currentRoutineExercise?.name ?? ""}`;
    }
    return (
      <>
        <span className="text-zinc-300 font-medium">{exerciseName}</span>
        {weightLabel != null && <span> · {weightLabel} lbs</span>}
      </>
    );
  };

  return (
    <div className="min-h-[100dvh]">
      <Navbar />

      {/* ─── MOBILE ─── */}
      <div className="md:hidden flex flex-col h-[100dvh]">
        <div className="relative flex-1 min-h-0 flex flex-col">
          {hasSelectedExercise && isMobile ? (
            <WebcamFeed mobile ghostCoachEnabled={ghostCoachEnabled} onDismissGhostCoach={() => setGhostCoachEnabled(false)} />
          ) : (
            <ExerciseCameraPlaceholder mobile />
          )}
          <MobileWorkoutHUD />
          <MobileCoachingToast />
        </div>

        <div
          className="shrink-0 glass border-t border-white/[0.04] rounded-t-3xl -mt-4 relative z-10 overflow-y-auto max-h-[50vh]"
          style={{ paddingBottom: "calc(4rem + var(--safe-bottom))" }}
        >
          {routineProgress && (
            <div className="px-4 pt-3">
              <RoutineProgressBar
                routineProgress={routineProgress}
                onExit={exitRoutine}
                onSetComplete={handleSetComplete}
                onRestComplete={handleRestComplete}
                onSkipRest={handleSkipRest}
              />
            </div>
          )}

          {!isWorkoutActive && !isCountingDown && !isFormChecking && !routineProgress?.isResting && (
            <>
              <div className="flex items-center gap-2 px-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExercises(!showExercises)}
                  className="flex-1 flex items-center justify-between gap-2 py-2.5 rounded-xl px-3"
                >
                  <span className="text-sm">
                    <span className="text-zinc-500">Exercise:</span>
                    <span className="text-zinc-100 font-semibold ml-2">{exerciseName}</span>
                    {weightLabel != null && (
                      <span className="text-zinc-600 ml-1.5 tabular-nums">@ {weightLabel} lbs</span>
                    )}
                  </span>
                  {showExercises ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  )}
                </button>
                {selectedExercise && getExerciseGuide(selectedExercise) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExerciseGuide(true)}
                    className="min-h-[40px] border-white/[0.08] bg-white/[0.02]"
                    title="How to do this exercise"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRoutineBuilder(true)}
                  className="min-h-[40px] border-white/[0.08] bg-white/[0.02]"
                  title="Routines"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExerciseManager(true)}
                  className="min-h-[40px] border-white/[0.08] bg-white/[0.02]"
                >
                  <ListPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {showExercises && (
                <div className="px-4 pb-2 pt-2 border-t border-white/[0.04] mt-2 mx-3">
                  <ExerciseSelector
                    onSelect={() => {
                      setShowExercises(false);
                      setSelectedUserExercise(null);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {!routineProgress?.isResting && (
            <div className="px-4 py-3 flex gap-3">
              <div className="flex-1">
                <WorkoutControls />
              </div>
              {!isWorkoutActive && !isCountingDown && !isFormChecking && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => { clearRepResults(); setRecordingBlob(null); startCountdown(true); }}
                  disabled={!hasSelectedExercise || !selectedExercise}
                  className="min-h-[48px] px-4 border-white/[0.08] bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 disabled:opacity-40"
                  title="Record workout with form analysis"
                >
                  <Video className="h-4 w-4 text-red-400" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="hidden md:block">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/10">
                <Zap className="h-5 w-5 text-cyan-400" strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-extrabold tracking-tight">Workout Studio</h1>
                  {isWorkoutActive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full glass-card px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-300">
                      <Radio className="h-3 w-3 animate-pulse" />
                      LIVE
                      {isRecording && (
                        <span className="text-red-400 ml-1 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          REC
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{headerSubtitle()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedExercise && getExerciseGuide(selectedExercise) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExerciseGuide(true)}
                  className="border-white/[0.08] bg-white/[0.02] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20"
                >
                  <HelpCircle className="h-4 w-4" /> How To
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoutineBuilder(true)}
                className="border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
              >
                <LayoutList className="h-4 w-4" />
                Routines
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExerciseManager(true)}
                className="border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
              >
                <ListPlus className="h-4 w-4" /> My Exercises
              </Button>
              {!isWorkoutActive && !isCountingDown && !isFormChecking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { clearRepResults(); setRecordingBlob(null); startCountdown(true); }}
                  disabled={!hasSelectedExercise || !selectedExercise}
                  className="border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-red-400 hover:border-red-500/20 disabled:opacity-40"
                >
                  <Video className="h-4 w-4 text-red-400" /> Record
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_380px] gap-5 items-start">
            <div className="space-y-4">
              <div
                className={cn(
                  "relative rounded-2xl overflow-hidden transition-all duration-700",
                  isWorkoutActive ? "border-glow glow-cyan" : "glass-card",
                )}
              >
                {isWorkoutActive && <div className="accent-line" />}
                <div className="bg-[#040408]">
                  {hasSelectedExercise && !isMobile ? <WebcamFeed ghostCoachEnabled={ghostCoachEnabled} onDismissGhostCoach={() => setGhostCoachEnabled(false)} /> : <ExerciseCameraPlaceholder />}
                </div>
              </div>
              <CoachingCues />
            </div>

            <aside className="space-y-4">
              {routineProgress && (
                <RoutineProgressBar
                  routineProgress={routineProgress}
                  onExit={exitRoutine}
                  onSetComplete={handleSetComplete}
                  onRestComplete={handleRestComplete}
                  onSkipRest={handleSkipRest}
                />
              )}
              {!routineProgress && (
                <GlassCard className="p-5">
                  <ExerciseSelector onSelect={() => setSelectedUserExercise(null)} />
                </GlassCard>
              )}
              <AICoachBadge />
              <GlassCard className="p-5">
                <WorkoutControls />
              </GlassCard>
              <GlassCard className="overflow-hidden">
                <LiveMetrics />
              </GlassCard>
            </aside>
          </div>
        </div>
      </div>

      <PerfectRepBanner />
      {lastSession && <PostWorkoutSummary />}
      {showExerciseManager && (
        <ExerciseManager
          onClose={() => setShowExerciseManager(false)}
          onSelectExercise={handleSelectUserExercise}
        />
      )}
      {showRoutineBuilder && (
        <RoutineBuilder onClose={() => setShowRoutineBuilder(false)} onStartRoutine={handleStartRoutine} />
      )}
      {showExerciseGuide && selectedExercise && getExerciseGuide(selectedExercise) && (
        <ExerciseGuideModal
          guide={getExerciseGuide(selectedExercise)!}
          onClose={() => setShowExerciseGuide(false)}
          onEnableGhostCoach={() => setGhostCoachEnabled(true)}
        />
      )}
    </div>
  );
}

function MobileCoachingToast() {
  const { currentCues, isWorkoutActive } = useWorkoutStore();
  if (!isWorkoutActive || currentCues.length === 0) return null;
  const cue = currentCues[0];
  const positive = cue.includes("Good") || cue.includes("Great");
  return (
    <div className="absolute bottom-2 left-3 right-3 z-20 pointer-events-none">
      <div
        className={cn(
          "mx-auto max-w-md glass rounded-xl px-4 py-3 text-center text-sm font-medium",
          positive ? "text-emerald-300" : "text-amber-200",
        )}
      >
        {cue}
      </div>
    </div>
  );
}
