"use client";

import { motion } from "framer-motion";
import { Activity, Mic, ShieldCheck, Sparkles } from "lucide-react";
import type { StressSignal } from "@/lib/mind/types";

const META: Record<
  StressSignal["source"],
  { label: string; icon: typeof Activity; tag: string }
> = {
  self_report:  { label: "Self-report",     icon: ShieldCheck, tag: "Direct" },
  breathing:    { label: "Breathing pace",  icon: Activity,    tag: "Estimated" },
  camera_ppg:   { label: "Camera estimate", icon: Mic,         tag: "On-device" },
  /** Legacy sessions may still list this; no longer added in new check-ins. */
  simulated:    { label: "Blended",         icon: Sparkles,    tag: "Heuristic" },
};

export function SignalStatusCard({ signals }: { signals: StressSignal[] }) {
  if (!signals.length) return null;

  return (
    <div className="mind-card rounded-2xl p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold mind-text-primary">Signals</h3>
        <span className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
          Live
        </span>
      </div>
      <div className="space-y-3">
        {signals.map((s, i) => {
          const m = META[s.source];
          const Icon = m.icon;
          return (
            <motion.div
              key={`${s.source}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Icon className="h-4 w-4 text-[#6FFFE9]" strokeWidth={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium mind-text-primary truncate">
                    {m.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider mind-text-secondary">
                    {m.tag}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(s.value * 100)}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-[#6FFFE9] to-[#5BC0BE]"
                  />
                </div>
              </div>
              <span className="text-[11px] tabular-nums mind-text-secondary w-10 text-right">
                {Math.round(s.confidence * 100)}%
              </span>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed mind-text-secondary">
        These inputs combine into one stress readout for routing and reflection. This is
        not a medical device and does not measure brain activity or diagnose any condition.
      </p>
    </div>
  );
}
