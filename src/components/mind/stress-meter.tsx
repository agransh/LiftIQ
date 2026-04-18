"use client";

import { motion } from "framer-motion";
import { levelLabel } from "@/lib/mind/intervention";
import { cn } from "@/lib/utils";

interface Props {
  level: number; // 0–1
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE = {
  sm: { track: "h-1.5", text: "text-xs", pad: "gap-1.5" },
  md: { track: "h-2.5", text: "text-sm", pad: "gap-2" },
  lg: { track: "h-3", text: "text-base", pad: "gap-2.5" },
} as const;

export function StressMeter({ level, size = "md", showLabel = true, className }: Props) {
  const s = SIZE[size];
  const { label, tone } = levelLabel(level);
  const pct = Math.round(Math.max(0, Math.min(1, level)) * 100);

  const toneStyles =
    tone === "calm"
      ? "from-[#6FFFE9] to-[#5BC0BE] text-[#6FFFE9]"
      : tone === "elevated"
        ? "from-amber-300 to-orange-400 text-amber-300"
        : "from-rose-400 to-red-500 text-rose-300";

  return (
    <div className={cn("flex flex-col", s.pad, className)}>
      {showLabel && (
        <div className={cn("flex items-baseline justify-between", s.text)}>
          <span className="mind-text-secondary font-medium tracking-wide uppercase text-[10px]">
            Stress
          </span>
          <span className={cn("font-bold tabular-nums", toneStyles.split(" ").pop())}>
            {pct}
            <span className="ml-1 text-[10px] opacity-70">/ 100 · {label}</span>
          </span>
        </div>
      )}
      <div className={cn("relative w-full overflow-hidden rounded-full bg-white/[0.06]", s.track)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r shadow-[0_0_18px_-4px_rgba(111,255,233,0.55)]",
            toneStyles.split(" ").slice(0, 2).join(" "),
          )}
        />
      </div>
    </div>
  );
}
