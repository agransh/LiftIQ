"use client";

import { useWorkoutStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";

export function CoachingCues() {
  const { currentCues, currentIssues, isWorkoutActive } = useWorkoutStore();

  if (!isWorkoutActive) {
    return (
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MessageCircle className="h-4 w-4" />
          Coaching
        </div>
        <p className="text-sm text-muted-foreground">
          Start a workout to receive live coaching cues.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        Live Coaching
      </div>

      {currentCues.length === 0 && currentIssues.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          Looking good! Keep it up.
        </div>
      ) : (
        <div className="space-y-2">
          {currentCues.map((cue, i) => (
            <div
              key={`${cue}-${i}`}
              className={cn(
                "flex items-start gap-2 text-sm rounded-lg px-3 py-2",
                cue.includes("Good") || cue.includes("Great")
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-yellow-500/10 text-yellow-400"
              )}
            >
              {cue.includes("Good") || cue.includes("Great") ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              {cue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
