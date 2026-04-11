"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 65) return "text-yellow-400";
  return "text-red-400";
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
      {/* Top HUD bar */}
      <div className="flex items-start justify-between p-3"
        style={{ paddingTop: "max(0.75rem, var(--safe-top))" }}
      >
        {/* Score */}
        <div className="glass-card rounded-xl px-3 py-2 min-w-[72px] text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
          <div className={cn("text-2xl font-bold tabular-nums leading-tight", getScoreColor(currentScore))}>
            {currentScore}
          </div>
        </div>

        {/* Phase + recording indicator */}
        <div className="flex flex-col items-center gap-1 mt-1">
          {isRecording && (
            <div className="glass-card rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-red-400 font-medium">REC</span>
            </div>
          )}
          <div className="glass-card rounded-full px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {currentPhase || "Ready"}
            </span>
          </div>
        </div>

        {/* Reps */}
        <div className="glass-card rounded-xl px-3 py-2 min-w-[72px] text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reps</div>
          <div className="text-2xl font-bold tabular-nums leading-tight">
            {repCount}
          </div>
        </div>
      </div>

      {/* Timer — top center below phase */}
      <div className="flex justify-center -mt-1">
        <div className="glass-card rounded-lg px-2.5 py-1">
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>
    </div>
  );
}
