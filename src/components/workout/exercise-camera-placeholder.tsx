"use client";

import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseCameraPlaceholderProps {
  mobile?: boolean;
}

export function ExerciseCameraPlaceholder({ mobile = false }: ExerciseCameraPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[#040408] text-center px-6 border border-white/[0.06] rounded-2xl",
        mobile ? "min-h-[min(50vh,420px)] flex-1" : "aspect-video min-h-[260px] w-full",
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-4">
        <Camera className="h-7 w-7 text-zinc-500" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-zinc-300 max-w-[280px]">
        Choose an exercise below
      </p>
      <p className="text-xs text-zinc-600 mt-1.5 max-w-[260px]">
        The camera turns on after you select a workout so we only access it when you&apos;re ready.
      </p>
    </div>
  );
}
