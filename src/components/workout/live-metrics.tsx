"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Target, Repeat, Timer, TrendingUp } from "lucide-react";

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-400";
  if (score >= 65) return "text-amber-400";
  return "text-rose-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 85) return "bg-green-400";
  if (score >= 65) return "bg-amber-400";
  return "bg-rose-400";
}

function getStrokeColor(score: number): string {
  if (score >= 85) return "#22c55e";
  if (score >= 65) return "#fbbf24";
  return "#f43f5e";
}

export function LiveMetrics() {
  const { currentScore, repCount, currentPhase, isWorkoutActive, sessionStartTime } = useWorkoutStore();
  const [elapsed, setElapsed] = useState(0);

  const score = Math.min(100, Math.max(0, currentScore));
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);

  useEffect(() => {
    if (!isWorkoutActive || !sessionStartTime) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isWorkoutActive, sessionStartTime]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  const phase = currentPhase?.trim() || "Ready";

  return (
    <div className="p-4 space-y-4">
      {/* Score ring */}
      <div className="flex flex-col items-center py-3">
        <div className="relative w-[130px] h-[130px]">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={getStrokeColor(score)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s",
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold tabular-nums tracking-tight", getScoreColor(score))}>
              {Math.round(score)}
            </span>
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mt-0.5">Score</span>
          </div>
        </div>

        <div className={cn(
          "mt-3 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wider uppercase transition-all duration-300",
          phase === "Ready"
            ? "bg-zinc-800 text-zinc-500 border border-zinc-700"
            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
        )}>
          {phase}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">
            <Repeat className="h-3 w-3" />
            Reps
          </div>
          <div className="text-2xl font-bold tabular-nums">{repCount}</div>
        </div>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">
            <Timer className="h-3 w-3" />
            Timer
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums">{mins}:{secs}</div>
        </div>
      </div>

      {repCount > 0 && (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3.5">
          <AvgScore />
        </div>
      )}
    </div>
  );
}

function AvgScore() {
  const { repResults } = useWorkoutStore();
  const avg = repResults.length > 0 ? Math.round(repResults.reduce((s, r) => s + r.score, 0) / repResults.length) : 0;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">
        <TrendingUp className="h-3 w-3" />
        Session Average
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-xl font-bold tabular-nums", getScoreColor(avg))}>
          {avg}<span className="text-sm text-zinc-600 ml-0.5">/100</span>
        </span>
      </div>
      <Progress value={avg} className="h-1.5 mt-2.5 bg-zinc-800" indicatorClassName={cn("transition-all duration-500", getScoreBarColor(avg))} />
    </div>
  );
}
