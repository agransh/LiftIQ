"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-400";
  if (score >= 65) return "text-amber-400";
  return "text-rose-400";
}

function getScorePillTint(score: number): string {
  if (score >= 85) return "border-green-500/25 bg-green-500/[0.08]";
  if (score >= 65) return "border-amber-500/25 bg-amber-500/[0.08]";
  return "border-rose-500/25 bg-rose-500/[0.08]";
}

export function MobileWorkoutHUD() {
  const {
    currentScore,
    repCount,
    currentPhase,
    isWorkoutActive,
    isRecording,
    sessionStartTime,
  } = useWorkoutStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isWorkoutActive || !sessionStartTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isWorkoutActive, sessionStartTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (!isWorkoutActive) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
      {/* Top HUD bar — score | phase + REC | reps */}
      <div
        className="flex items-start justify-between gap-2 px-3 pt-3"
        style={{ paddingTop: "max(0.75rem, var(--safe-top))" }}
      >
        {/* Score — left */}
        <div
          className={cn(
            "glass-card rounded-2xl px-3.5 py-2.5 min-w-[76px] text-center shadow-lg shadow-black/20",
            getScorePillTint(currentScore)
          )}
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Score
          </div>
          <div
            className={cn(
              "text-2xl font-bold tabular-nums leading-tight",
              getScoreColor(currentScore)
            )}
          >
            {currentScore}
          </div>
        </div>

        {/* Phase + REC — center */}
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1.5 mt-0.5">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {isRecording && (
              <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-2 border-red-500/30 shadow-md shadow-black/25">
                <span className="h-2 w-2 rounded-full shrink-0 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.65)] animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-red-400">
                  REC
                </span>
              </div>
            )}

            <div className="glass-card rounded-full px-3.5 py-1.5 shadow-md shadow-black/25 border-white/[0.06]">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
                Phase
              </div>
              <div className="text-xs font-semibold tracking-tight text-foreground text-center max-w-[140px] truncate">
                {currentPhase || "Ready"}
              </div>
            </div>
          </div>
        </div>

        {/* Reps — right */}
        <div className="glass-card rounded-2xl px-3.5 py-2.5 min-w-[76px] text-center border-white/[0.06] shadow-lg shadow-black/20">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Reps
          </div>
          <div className="text-2xl font-bold tabular-nums leading-tight text-foreground">
            {repCount}
          </div>
        </div>
      </div>

      {/* Timer — centered below */}
      <div className="flex justify-center px-3 pb-1 pt-1">
        <div className="rounded-full px-4 py-2 min-w-[120px] text-center bg-zinc-900/80 backdrop-blur-md border border-zinc-700 shadow-md">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Timer
          </div>
          <span className="text-sm font-mono tabular-nums font-semibold text-foreground tracking-wide">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>
    </div>
  );
}
