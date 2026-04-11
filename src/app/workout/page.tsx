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
import { GlassCard } from "@/components/ui/glass-card";
import { ChevronDown, ChevronUp, ListPlus, Video, Zap, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WorkoutPage() {
  const router = useRouter();
  const {
    lastSession, selectedExercise, isWorkoutActive, isRecording,
    poseStatus, sessionWeight, setSelectedExercise, setSessionWeight, startWorkout,
  } = useWorkoutStore();
  const [showExercises, setShowExercises] = useState(false);
  const [showExerciseManager, setShowExerciseManager] = useState(false);
  const [selectedUserExercise, setSelectedUserExercise] = useState<UserExercise | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasCompletedOnboarding()) router.push("/onboarding");
  }, [router]);

  const exerciseName = selectedUserExercise?.name || selectedExercise.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const weightLabel = selectedUserExercise?.weight ?? sessionWeight;

  const handleSelectUserExercise = (ex: UserExercise) => {
    setSelectedUserExercise(ex);
    if (ex.trackingId !== "custom") setSelectedExercise(ex.trackingId);
    if (ex.weight) setSessionWeight(ex.weight);
  };

  return (
    <div className="min-h-[100dvh]">
      <Navbar />

      {/* ─── MOBILE ─── */}
      <div className="md:hidden flex flex-col h-[100dvh]">
        <div className="relative flex-1 min-h-0">
          <WebcamFeed mobile />
          <MobileWorkoutHUD />
          <MobileCoachingToast />
        </div>

        <div className="shrink-0 glass border-t border-white/[0.04] rounded-t-3xl -mt-4 relative z-10" style={{ paddingBottom: "calc(1rem + var(--safe-bottom))" }}>
          {!isWorkoutActive && (
            <>
              <div className="flex items-center gap-2 px-4 pt-4">
                <button
                  onClick={() => setShowExercises(!showExercises)}
                  className="flex-1 flex items-center justify-between gap-2 py-2.5 rounded-xl px-3"
                >
                  <span className="text-sm">
                    <span className="text-zinc-500">Exercise:</span>
                    <span className="text-zinc-100 font-semibold ml-2">{exerciseName}</span>
                    {weightLabel != null && <span className="text-zinc-600 ml-1.5 tabular-nums">@ {weightLabel} lbs</span>}
                  </span>
                  {showExercises ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                </button>
                <Button variant="outline" size="sm" onClick={() => setShowExerciseManager(true)} className="min-h-[40px] border-white/[0.08] bg-white/[0.02]">
                  <ListPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {showExercises && (
                <div className="px-4 pb-2 pt-2 border-t border-white/[0.04] mt-2 mx-3">
                  <ExerciseSelector onSelect={() => { setShowExercises(false); setSelectedUserExercise(null); }} />
                </div>
              )}
            </>
          )}
          <div className="px-4 py-3 flex gap-3">
            <div className="flex-1"><WorkoutControls /></div>
            {!isWorkoutActive && (
              <Button variant="outline" size="lg" onClick={() => startWorkout(true)} className="min-h-[48px] px-4 border-white/[0.08] bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20">
                <Video className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── DESKTOP ─── */}
      <div className="hidden md:block">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-6">
          {/* Header */}
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
                      {isRecording && <span className="text-red-400 ml-1 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />REC</span>}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  <span className="text-zinc-300 font-medium">{exerciseName}</span>
                  {weightLabel != null && <span> · {weightLabel} lbs</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowExerciseManager(true)} className="border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]">
                <ListPlus className="h-4 w-4" /> My Exercises
              </Button>
              {!isWorkoutActive && (
                <Button variant="outline" size="sm" onClick={() => startWorkout(true)} className="border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-red-400 hover:border-red-500/20">
                  <Video className="h-4 w-4 text-red-400" /> Record
                </Button>
              )}
            </div>
          </div>

          {/* ── Main grid: webcam hero + sidebar ── */}
          <div className="grid grid-cols-[1fr_380px] gap-5 items-start">
            {/* Webcam stage */}
            <div className="space-y-4">
              <div className={cn(
                "relative rounded-2xl overflow-hidden transition-all duration-700",
                isWorkoutActive
                  ? "border-glow glow-cyan"
                  : "glass-card"
              )}>
                {isWorkoutActive && <div className="accent-line" />}
                <div className="bg-[#040408]">
                  <WebcamFeed />
                </div>
              </div>
              <CoachingCues />
            </div>

            {/* Sidebar */}
            <aside className="space-y-4">
              <GlassCard className="p-5">
                <ExerciseSelector onSelect={() => setSelectedUserExercise(null)} />
              </GlassCard>
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

      {lastSession && <PostWorkoutSummary />}
      {showExerciseManager && <ExerciseManager onClose={() => setShowExerciseManager(false)} onSelectExercise={handleSelectUserExercise} />}
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
      <div className={cn(
        "mx-auto max-w-md glass rounded-xl px-4 py-3 text-center text-sm font-medium",
        positive ? "text-emerald-300" : "text-amber-200"
      )}>
        {cue}
      </div>
    </div>
  );
}
