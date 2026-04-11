"use client";

import { cn } from "@/lib/utils";

interface MetricTileProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
}

export function MetricTile({ label, value, icon, accent, className }: MetricTileProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-5", className)}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-cyan-400/70">{icon}</span>}
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">{label}</span>
      </div>
      <div className={cn("text-2xl md:text-3xl font-bold tabular-nums tracking-tight", accent || "text-zinc-100")}>
        {value}
      </div>
    </div>
  );
}
