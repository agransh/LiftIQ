"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  CalendarDays,
  HeartPulse,
  LifeBuoy,
  TrendingDown,
  TrendingUp,
  Wind,
} from "lucide-react";
import type { CheckIn, InterventionKind, MindSessionSummary } from "@/lib/mind/types";
import { interventionDisplayName, levelLabel } from "@/lib/mind/intervention";
import { cn } from "@/lib/utils";

const MS_DAY = 86400000;

function inLastDays(ts: number, days: number): boolean {
  return ts >= Date.now() - days * MS_DAY;
}

const interventionIcon: Record<InterventionKind, typeof Wind> = {
  breathing: Wind,
  reflection: BookOpen,
  support: LifeBuoy,
};

const interventionAccent: Record<InterventionKind, string> = {
  breathing: "from-cyan-400/20 to-[#5BC0BE]/10 border-cyan-400/20",
  reflection: "from-violet-400/15 to-[#6FFFE9]/5 border-violet-400/20",
  support: "from-rose-400/15 to-amber-500/10 border-rose-400/25",
};

const interventionIconClass: Record<InterventionKind, string> = {
  breathing: "text-cyan-300",
  reflection: "text-violet-300",
  support: "text-rose-300",
};

interface Props {
  checkIns: CheckIn[];
  sessions: MindSessionSummary[];
}

export function MindInsightsSection({ checkIns, sessions }: Props) {
  const totalCheckIns = checkIns.length;
  const totalSessions = sessions.length;
  const weekCount =
    checkIns.filter((c) => inLastDays(c.createdAt, 7)).length +
    sessions.filter((s) => inLastDays(s.createdAt, 7)).length;

  const trend = [...checkIns]
    .slice(0, 7)
    .reverse()
    .map((c) => Math.round(c.level * 100));

  return (
    <div className="mt-10 space-y-8">
      {/* Summary metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Check-ins",
            value: totalCheckIns,
            hint: "All time on this device",
            icon: HeartPulse,
            className:
              "bg-gradient-to-br from-[#6FFFE9]/[0.12] to-transparent border-[#6FFFE9]/20",
            iconWrap: "bg-[#6FFFE9]/15 border-[#6FFFE9]/30 text-[#6FFFE9]",
          },
          {
            label: "Mind sessions",
            value: totalSessions,
            hint: "Breathe, journal, support",
            icon: CalendarDays,
            className:
              "bg-gradient-to-br from-violet-500/[0.12] to-transparent border-violet-400/20",
            iconWrap: "bg-violet-500/15 border-violet-400/30 text-violet-200",
          },
          {
            label: "Last 7 days",
            value: weekCount,
            hint: "Check-ins + sessions",
            icon: Activity,
            className:
              "bg-gradient-to-br from-cyan-500/10 to-[#1C2541]/40 border-cyan-400/20",
            iconWrap: "bg-cyan-500/15 border-cyan-400/25 text-cyan-200",
          },
        ].map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border p-5 mind-card",
              tile.className,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] mind-text-secondary">
                  {tile.label}
                </p>
                <p className="mt-2 text-3xl font-black tabular-nums tracking-tight mind-text-primary">
                  {tile.value}
                </p>
                <p className="mt-1 text-[11px] mind-text-secondary">{tile.hint}</p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                  tile.iconWrap,
                )}
              >
                <tile.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
            </div>
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/[0.04] blur-2xl" />
          </motion.div>
        ))}
      </div>

      {/* Stress trend + recent activity */}
      <div className="grid gap-5 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 mind-card-elev rounded-3xl p-6"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold mind-text-primary">Stress trend</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
              From check-ins
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed mind-text-secondary">
            Last few readings (0 = calmer, 100 = more stressed). Not a medical measure.
          </p>

          {trend.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-10 text-center">
              <p className="text-[13px] font-medium mind-text-primary">No data yet</p>
              <p className="mt-1 max-w-[200px] text-[11px] mind-text-secondary">
                Complete a check-in to see your pattern here.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex h-[7.5rem] items-end justify-between gap-2">
                {trend.map((v, i) => {
                  const { tone } = levelLabel(v / 100);
                  const hPx = Math.max(6, Math.round((v / 100) * 100));
                  const barClass =
                    tone === "calm"
                      ? "from-[#6FFFE9] to-[#5BC0BE]"
                      : tone === "elevated"
                        ? "from-amber-300 to-orange-500"
                        : "from-rose-400 to-red-500";
                  return (
                    <div
                      key={i}
                      className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                    >
                      <div className="flex h-24 w-full max-w-[32px] flex-col items-center justify-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: hPx }}
                          transition={{ duration: 0.55, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "w-full min-h-1.5 max-h-24 rounded-t-md bg-gradient-to-t shadow-[0_0_16px_-4px_rgba(111,255,233,0.3)]",
                            barClass,
                          )}
                        />
                      </div>
                      <span className="text-[9px] font-medium tabular-nums text-white/40">{v}</span>
                    </div>
                  );
                })}
              </div>
              {trend.length > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px]">
                  <span className="mind-text-secondary">Oldest</span>
                  <span className="font-medium tabular-nums mind-text-primary">
                    {trend[0]} <span className="text-white/30">→</span> {trend[trend.length - 1]}
                  </span>
                  <span className="mind-text-secondary">Newest</span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="lg:col-span-3 mind-card-elev rounded-3xl p-0 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <h3 className="text-sm font-semibold mind-text-primary">Recent activity</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
              This device
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] font-medium mind-text-primary">No sessions yet</p>
              <p className="mt-1 text-[12px] mind-text-secondary">
                After you breathe, journal, or use support, you will see a trail here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {sessions.map((s) => {
                const I = interventionIcon[s.intervention];
                const start = Math.round(s.startLevel * 100);
                const end = typeof s.endLevel === "number" ? Math.round(s.endLevel * 100) : null;
                const delta =
                  end != null && end < start
                    ? start - end
                    : end != null && end > start
                      ? end - start
                      : 0;
                const improved = end != null && end < start;
                const worse = end != null && end > start;
                return (
                  <li key={s.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br",
                            interventionAccent[s.intervention],
                          )}
                        >
                          <I
                            className={cn("h-5 w-5", interventionIconClass[s.intervention])}
                            strokeWidth={1.5}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold mind-text-primary truncate">
                            {interventionDisplayName(s.intervention)}
                          </p>
                          <p className="text-[11px] mind-text-secondary">
                            {new Date(s.createdAt).toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
                          <div className="flex items-baseline gap-1.5 tabular-nums">
                            <span className="text-lg font-bold text-white/90">{start}</span>
                            {end != null && (
                              <>
                                <span className="text-xs text-white/30">→</span>
                                <span
                                  className={cn(
                                    "text-lg font-bold",
                                    improved
                                      ? "text-[#6FFFE9]"
                                      : worse
                                        ? "text-amber-300/90"
                                        : "text-white/80",
                                  )}
                                >
                                  {end}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {end != null && (improved || worse) && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-semibold",
                              improved
                                ? "bg-[#6FFFE9]/10 text-[#6FFFE9]"
                                : "bg-amber-500/10 text-amber-200/90",
                            )}
                          >
                            {improved ? (
                              <TrendingDown className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingUp className="h-3.5 w-3.5" />
                            )}
                            {delta}
                          </span>
                        )}
                        {end == null && (
                          <span className="text-[10px] uppercase tracking-wider text-white/30">
                            Start
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
