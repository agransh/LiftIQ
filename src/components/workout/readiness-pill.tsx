"use client";

import { useWorkoutStore } from "@/lib/store";
import { CheckCircle2, AlertTriangle, Loader2, Activity, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact readiness indicator for "Minimal Coaching" mode.
 *
 * Replaces the full ghost-coach overlay on phones with a small red/yellow/green
 * pill at the top of the camera view. Driven entirely from `readiness` in the
 * workout store, which is set by the form-check + family-drift pipeline.
 */
export function ReadinessPill({ className }: { className?: string }) {
  const readiness = useWorkoutStore((s) => s.readiness);
  const message = useWorkoutStore((s) => s.readinessMessage);

  if (readiness === "idle") return null;

  const variant = (() => {
    switch (readiness) {
      case "framing":
        return {
          tone: "neutral" as const,
          Icon: Eye,
          label: "Framing",
          fallback: "Step into the camera view",
        };
      case "wrong_pose":
        return {
          tone: "bad" as const,
          Icon: AlertTriangle,
          label: "Wrong pose",
          fallback: "Get into the starting position",
        };
      case "almost":
        return {
          tone: "warn" as const,
          Icon: Loader2,
          label: "Almost",
          fallback: "Adjust your form",
        };
      case "ready":
        return {
          tone: "good" as const,
          Icon: CheckCircle2,
          label: "Hold it",
          fallback: "Hold this position",
        };
      case "active":
        return {
          tone: "good" as const,
          Icon: Activity,
          label: "Tracking",
          fallback: "",
        };
      case "off_track":
        return {
          tone: "bad" as const,
          Icon: AlertTriangle,
          label: "Off-track",
          fallback: "Return to the starting position",
        };
    }
  })();

  const tones = {
    good: "bg-emerald-500/20 border-emerald-400/40 text-emerald-200",
    warn: "bg-amber-500/20 border-amber-400/40 text-amber-200",
    bad: "bg-rose-500/25 border-rose-400/50 text-rose-100",
    neutral: "bg-slate-500/25 border-slate-300/30 text-slate-100",
  } as const;

  const dot = {
    good: "bg-emerald-400",
    warn: "bg-amber-400",
    bad: "bg-rose-400",
    neutral: "bg-slate-300",
  } as const;

  const detail = message || variant.fallback;
  const showSpinner = readiness === "almost" || readiness === "ready";

  return (
    <div
      className={cn(
        "pointer-events-none flex items-center gap-2 max-w-[88vw] rounded-full border px-3 py-1.5 backdrop-blur-md shadow-lg",
        tones[variant.tone],
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full animate-pulse", dot[variant.tone])} />
      <variant.Icon className={cn("h-3.5 w-3.5 shrink-0", showSpinner && "animate-spin")} />
      <span className="text-[11px] font-bold uppercase tracking-wider shrink-0">{variant.label}</span>
      {detail && (
        <span className="text-[11px] font-medium opacity-90 truncate min-w-0">
          {detail}
        </span>
      )}
    </div>
  );
}
