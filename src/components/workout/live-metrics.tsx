"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Target, Repeat, Timer, TrendingUp } from "lucide-react";

function getScoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 65) return "text-yellow-400";
  return "text-red-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-400";
  if (score >= 65) return "bg-yellow-400";
  return "bg-red-400";
}

export function LiveMetrics() {
  const {
    currentScore,
    repCount,
    currentPhase,
    isWorkoutActive,
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

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Form Score
          </div>
          <span className="text-xs text-muted-foreground uppercase">
            {currentPhase || "Ready"}
          </span>
        </div>
        <div
          className={cn(
            "text-4xl font-bold tabular-nums",
            getScoreColor(currentScore)
          )}
        >
          {currentScore}
          <span className="text-lg text-muted-foreground">/100</span>
        </div>
        <Progress
          value={currentScore}
          className="mt-3 h-2"
          indicatorClassName={getScoreBarColor(currentScore)}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Repeat className="h-4 w-4" />
            Reps
          </div>
          <div className="text-3xl font-bold tabular-nums">{repCount}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Timer className="h-4 w-4" />
            Time
          </div>
          <div className="text-3xl font-bold tabular-nums font-mono">
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      {/* Avg score */}
      {repCount > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            Average Score
          </div>
          <AvgScore />
        </div>
      )}
    </div>
  );
}

function AvgScore() {
  const { repResults } = useWorkoutStore();
  const avg =
    repResults.length > 0
      ? Math.round(
          repResults.reduce((s, r) => s + r.score, 0) / repResults.length
        )
      : 0;

  return (
    <div className={cn("text-2xl font-bold tabular-nums", getScoreColor(avg))}>
      {avg}
      <span className="text-sm text-muted-foreground">/100</span>
    </div>
  );
}
