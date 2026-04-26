"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  HeartPulse,
  LifeBuoy,
  Wind,
} from "lucide-react";
import { MindHero } from "@/components/mind/mind-hero";
import { StressMeter } from "@/components/mind/stress-meter";
import { getCheckIns, getMindSessions } from "@/lib/mind/storage";
import { interventionCopy, levelLabel } from "@/lib/mind/intervention";
import type { CheckIn, MindSessionSummary } from "@/lib/mind/types";

const QUICK_ACTIONS = [
  {
    href: "/mind/check-in",
    title: "Check in",
    desc: "A 30-second pulse on how you feel.",
    icon: HeartPulse,
  },
  {
    href: "/mind/breathe",
    title: "Breathe",
    desc: "A guided 2-minute breathing session.",
    icon: Wind,
  },
  {
    href: "/mind/journal",
    title: "Journal",
    desc: "Write a few lines, get a gentle reflection.",
    icon: BookOpen,
  },
  {
    href: "/mind/support",
    title: "Support",
    desc: "Grounding tools and crisis resources.",
    icon: LifeBuoy,
  },
] as const;

function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Late night,";
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  if (h < 21) return "Good evening,";
  return "Easy now,";
}

export default function MindDashboardPage() {
  const [data, setData] = useState<{
    latest: CheckIn | null;
    sessions: MindSessionSummary[];
  }>({ latest: null, sessions: [] });

  // Read from localStorage on the client after mount.
  useEffect(() => {
    queueMicrotask(() => {
      setData({
        latest: getCheckIns()[0] ?? null,
        sessions: getMindSessions().slice(0, 5),
      });
    });
  }, []);

  const { latest, sessions } = data;

  const intervention = latest ? interventionCopy(latest.intervention) : null;
  const tone = latest ? levelLabel(latest.level).tone : "calm";

  return (
    <main>
      <MindHero
        greeting={greetingFor()}
        subline="Check in, breathe, and journal in one place. We’ll meet you where you are — no performance, no scoreboard."
      />

      <section className="mx-auto max-w-5xl px-6 lg:px-8 pb-12">
        {/* Status / latest check-in */}
        <div className="grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mind-card-elev rounded-3xl p-7"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6FFFE9]">
              {latest ? "Last check-in" : "No check-in yet"}
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight mind-text-primary">
              {latest
                ? tone === "calm"
                  ? "You're in a calm range"
                  : tone === "elevated"
                    ? "A little elevated"
                    : "Carrying a lot today"
                : "Let's get a baseline"}
            </h2>
            <p className="mt-1.5 text-[13px] mind-text-secondary">
              {latest
                ? new Date(latest.createdAt).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Your first check-in takes about 30 seconds."}
            </p>

            <div className="mt-6">
              <StressMeter level={latest?.level ?? 0.0} size="lg" />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={intervention?.href ?? "/mind/check-in"}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6FFFE9] to-[#5BC0BE] px-5 py-2.5 text-sm font-bold text-[#0B132B] shadow-[0_0_28px_-8px_rgba(111,255,233,0.55)] transition-all hover:brightness-110"
              >
                {intervention?.cta ?? "Start a check-in"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {latest && (
                <Link
                  href="/mind/check-in"
                  className="text-[13px] font-medium mind-text-secondary hover:text-white transition-colors"
                >
                  Re-check
                </Link>
              )}
            </div>

            {intervention && (
              <p className="mt-5 text-[13px] leading-relaxed mind-text-secondary">
                {intervention.blurb}
              </p>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="grid grid-cols-2 gap-3"
          >
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group mind-card rounded-2xl p-5 transition-all hover:bg-white/[0.06] hover:border-[#6FFFE9]/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#6FFFE9]/10 border border-[#6FFFE9]/20 transition-shadow group-hover:shadow-[0_0_22px_-6px_rgba(111,255,233,0.55)]">
                  <a.icon className="h-5 w-5 text-[#6FFFE9]" strokeWidth={1.6} />
                </div>
                <div className="text-sm font-semibold mind-text-primary">{a.title}</div>
                <div className="mt-1 text-[12px] mind-text-secondary leading-relaxed">
                  {a.desc}
                </div>
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold mind-text-primary">Recent sessions</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
                This device
              </span>
            </div>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="mind-card flex items-center justify-between rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#6FFFE9]/10 border border-[#6FFFE9]/20">
                      {s.intervention === "breathing" ? (
                        <Wind className="h-4 w-4 text-[#6FFFE9]" />
                      ) : s.intervention === "reflection" ? (
                        <BookOpen className="h-4 w-4 text-[#6FFFE9]" />
                      ) : (
                        <LifeBuoy className="h-4 w-4 text-[#6FFFE9]" />
                      )}
                    </span>
                    <div>
                      <div className="text-[13px] font-medium mind-text-primary capitalize">
                        {s.intervention}
                      </div>
                      <div className="text-[11px] mind-text-secondary">
                        {new Date(s.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] mind-text-secondary tabular-nums">
                    {Math.round(s.startLevel * 100)}
                    {typeof s.endLevel === "number" && (
                      <>
                        {" → "}
                        <span className="text-[#6FFFE9]">{Math.round(s.endLevel * 100)}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-12 text-center text-[11px] mind-text-secondary">
          Stress levels here come from your check-in: what you report plus an optional
          breath-rate estimate from tap timing. This is for wellness and reflection only —
          not medical advice.
        </p>
      </section>
    </main>
  );
}
