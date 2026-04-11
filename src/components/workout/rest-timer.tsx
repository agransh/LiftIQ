"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
  label?: string;
}

export function RestTimer({ initialSeconds, onComplete, onSkip, label }: RestTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    queueMicrotask(() => {
      setRemaining(initialSeconds);
      completedRef.current = false;
      setIsPaused(false);
    });
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, remaining]);

  useEffect(() => {
    if (remaining === 0 && !completedRef.current) {
      completedRef.current = true;
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      onComplete();
    }
  }, [remaining, onComplete]);

  const handleReset = useCallback(() => {
    completedRef.current = false;
    setRemaining(initialSeconds);
    setIsPaused(false);
  }, [initialSeconds]);

  const progress = 1 - remaining / initialSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {label && (
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      )}

      {/* Circular progress */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            className="text-secondary"
            strokeWidth="6"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            className={cn(
              "transition-all duration-1000 ease-linear",
              remaining <= 5 ? "text-red-400" : remaining <= 10 ? "text-yellow-400" : "text-primary"
            )}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-3xl font-bold tabular-nums",
            remaining <= 5 && "text-red-400",
            remaining <= 10 && remaining > 5 && "text-yellow-400"
          )}>
            {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : seconds}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="h-10 w-10 rounded-full"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaused(!isPaused)}
          className="h-12 w-12 rounded-full"
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onSkip}
          className="h-10 w-10 rounded-full"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {remaining === 0 && (
        <div className="text-sm font-semibold text-primary animate-pulse">
          Rest complete! Time to work.
        </div>
      )}
    </div>
  );
}
