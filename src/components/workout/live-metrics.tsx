"use client";

import { useEffect, useState, useRef } from "react";
import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Repeat, Timer, TrendingUp, Star, Flame, Crown } from "lucide-react";

function getScoreColor(s: number) { return s >= 85 ? "text-emerald-400" : s >= 65 ? "text-amber-400" : "text-rose-400"; }
function getBarColor(s: number) { return s >= 85 ? "bg-emerald-400" : s >= 65 ? "bg-amber-400" : "bg-rose-400"; }
function getStroke(s: number) { return s >= 85 ? "#34d399" : s >= 65 ? "#fbbf24" : "#f43f5e"; }

export function LiveMetrics() {
  const { currentScore, repCount, currentPhase, isWorkoutActive, sessionStartTime, bestRepScore, bestRepIndex } = useWorkoutStore();
  const [elapsed, setElapsed] = useState(0);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevScore = useRef(currentScore);

  useEffect(() => {
    if (Math.abs(currentScore - prevScore.current) > 10) {
      setScoreFlash(true);
      const t = setTimeout(() => setScoreFlash(false), 400);
      prevScore.current = currentScore;
      return () => clearTimeout(t);
    }
    prevScore.current = currentScore;
  }, [currentScore]);

  const score = Math.min(100, Math.max(0, currentScore));
  const circ = 2 * Math.PI * 48;
  const offset = circ * (1 - score / 100);

  useEffect(() => {
    if (!isWorkoutActive || !sessionStartTime) {
      queueMicrotask(() => setElapsed(0));
      return;
    }
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [isWorkoutActive, sessionStartTime]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");
  const phase = currentPhase?.trim() || "Ready";

  return (
    <div className="p-5 space-y-5">
      {/* Score ring */}
      <div className="flex flex-col items-center py-2">
        <div className="relative w-[120px] h-[120px]">
          <svg viewBox="0 0 108 108" className="w-full h-full">
            <circle cx="54" cy="54" r="48" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
            <circle
              cx="54" cy="54" r="48" fill="none"
              stroke={getStroke(score)}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s", filter: `drop-shadow(0 0 6px ${getStroke(score)}44)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-3xl font-black tabular-nums tracking-tight transition-transform duration-300",
              getScoreColor(score),
              scoreFlash && "scale-110"
            )}>
              {Math.round(score)}
            </span>
            <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-[0.2em] mt-0.5">Score</span>
          </div>
        </div>

        <div className={cn(
          "mt-3 rounded-full px-3.5 py-1 text-[10px] font-bold tracking-[0.15em] uppercase transition-all",
          phase === "Ready"
            ? "glass-card text-zinc-500"
            : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/15"
        )}>
          {phase}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1.5">
            <Repeat className="h-3 w-3" /> Reps
          </div>
          <div className="text-2xl font-black tabular-nums">{repCount}</div>
        </div>
        <div className="glass-card rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1.5">
            <Timer className="h-3 w-3" /> Timer
          </div>
          <div className="text-2xl font-black font-mono tabular-nums">{mins}:{secs}</div>
        </div>
      </div>

      {repCount > 0 && (
        <div className="glass-card rounded-xl p-3.5">
          <AvgScore />
        </div>
      )}

      {bestRepIndex >= 0 && <BestRepTile />}
    </div>
  );
}

function BestRepTile() {
  const { bestRepScore, bestRepIndex, perfectRepCount } = useWorkoutStore();
  const [glowActive, setGlowActive] = useState(false);
  const prevBest = useRef(bestRepScore);
  const isPerfect = bestRepScore >= 90;

  useEffect(() => {
    if (bestRepScore > prevBest.current && bestRepScore > 0) {
      setGlowActive(true);
      const t = setTimeout(() => setGlowActive(false), 1200);
      prevBest.current = bestRepScore;
      return () => clearTimeout(t);
    }
    prevBest.current = bestRepScore;
  }, [bestRepScore]);

  return (
    <div className={cn(
      "rounded-xl p-3.5 transition-all duration-700",
      isPerfect
        ? "bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.04] border border-amber-500/15"
        : "glass-card",
      glowActive && isPerfect && "shadow-[0_0_24px_-4px_rgba(245,158,11,0.3)]",
      glowActive && !isPerfect && "shadow-[0_0_24px_-4px_rgba(6,182,212,0.2)]",
    )}>
      <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1.5">
        {isPerfect ? <Crown className="h-3 w-3 text-amber-400" /> : <Star className="h-3 w-3 text-amber-400" />}
        {isPerfect ? "Perfect Rep" : "Best Rep"}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xl font-bold tabular-nums transition-all duration-300",
          getScoreColor(bestRepScore),
          glowActive && "scale-110"
        )}>
          {bestRepScore}
        </span>
        <span className="text-xs text-zinc-600">Rep #{bestRepIndex + 1}</span>
      </div>
      {perfectRepCount > 1 && (
        <div className="flex items-center gap-1 mt-1.5">
          <Flame className="h-3 w-3 text-amber-400/70" />
          <span className="text-[10px] text-amber-400/60 font-semibold tabular-nums">{perfectRepCount} perfect reps this set</span>
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
      <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1.5">
        <TrendingUp className="h-3 w-3" /> Session Average
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-xl font-bold tabular-nums", getScoreColor(avg))}>{avg}<span className="text-sm text-zinc-600 ml-0.5">/100</span></span>
      </div>
      <Progress value={avg} className="h-1.5 mt-2.5 bg-white/[0.04]" indicatorClassName={cn("transition-all duration-500", getBarColor(avg))} />
    </div>
  );
}
