"use client";

import { useWorkoutStore } from "@/lib/store";
import { saveSession, updateStreak } from "@/lib/storage";
import { saveRecording } from "@/lib/storage/recordings-db";
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
    hasSelectedExercise,
    sessionStartTime,
    sessionWeight,
    repResults,
    recordingBlob,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    clearRepResults,
    setLastSession,
    setRecordingBlob,
    setRepCount,
    setCurrentScore,
    setCurrentCues,
    setCurrentIssues,
    setCurrentPhase,
  } = useWorkoutStore();

  const handleStart = () => {
    if (!hasSelectedExercise || !selectedExercise) return;
    clearRepResults();
    setRecordingBlob(null);
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

    const recordingId = isRecording ? `rec-${now}` : undefined;

    const bestIdx = repResults.length > 0
      ? repResults.reduce((best, r, i) => (r.score > repResults[best].score ? i : best), 0)
      : -1;

    const allIssues = repResults.flatMap((r) => r.issues);
    const issueCounts: Record<string, number> = {};
    for (const iss of allIssues) if (iss.message) issueCounts[iss.message] = (issueCounts[iss.message] || 0) + 1;
    const mistakeSummary = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    const scoreTimeline = repResults.map((r) => ({
      time: r.timestamp - (sessionStartTime || now),
      score: r.score,
    }));

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
      recordingId,
      bestRepIndex: bestIdx,
      bestRepScore: bestIdx >= 0 ? repResults[bestIdx].score : 0,
      scoreTimeline,
      mistakeSummary,
    };

    try {
      saveSession(session);
      await updateStreak();
    } catch (err) {
      // Supabase or local save can fail offline / misconfigured — still end the workout
      console.warn("Workout save/sync failed:", err);
    }

    setLastSession(session);

    // Stop workout so MediaRecorder fires onstop and sets the blob
    stopWorkout();

    // Save recording blob to IndexedDB after a short delay for the blob to be set
    if (isRecording && recordingId) {
      const duration = Math.floor((now - (sessionStartTime || now)) / 1000);
      setTimeout(async () => {
        const blob = useWorkoutStore.getState().recordingBlob;
        if (blob) {
          await saveRecording(
            {
              id: recordingId,
              sessionId: session.id,
              exercise: selectedExercise,
              exerciseName: config?.name || selectedExercise,
              reps: repResults.length,
              score: totalScore,
              duration,
              createdAt: now,
              size: blob.size,
            },
            blob
          );
          setRecordingBlob(null);
        }
      }, 500);
    }
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
    <div className="glass-card w-full rounded-2xl p-3">
      {!isWorkoutActive ? (
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <Button
            onClick={handleStart}
            size="lg"
            disabled={!hasSelectedExercise || !selectedExercise}
            className="w-full min-h-[48px] rounded-xl shadow-md shadow-primary/15 transition-all hover:shadow-lg hover:shadow-primary/20 hover:brightness-105 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="min-h-[48px] rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all sm:shrink-0 sm:px-5"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-stretch gap-2">
          {isRecording && (
            <div
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl glass-card border-red-500/20 px-2.5 min-h-[48px] min-w-[3.25rem]"
              aria-hidden
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]" />
              </span>
              <CircleDot className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-red-400 leading-none">
                REC
              </span>
            </div>
          )}
          {isPaused ? (
            <Button
              onClick={resumeWorkout}
              variant="outline"
              size="lg"
              className="min-h-[48px] flex-1 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button
              onClick={pauseWorkout}
              variant="outline"
              size="lg"
              className="min-h-[48px] flex-1 rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          <Button
            onClick={handleStop}
            variant="destructive"
            size="lg"
            className="min-h-[48px] shrink-0 rounded-xl shadow-md shadow-destructive/20 hover:shadow-lg hover:shadow-destructive/30 transition-all px-4 sm:px-5"
          >
            <Square className="h-4 w-4" />
            End
          </Button>
        </div>
      )}
    </div>
  );
}
