"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BreathingWidget } from "@/components/mind/breathing-widget";
import { AIReflectionPanel } from "@/components/mind/ai-reflection-panel";
import { saveBreathingSession, saveMindSession, getLatestCheckIn } from "@/lib/mind/storage";

export default function BreathePage() {
  const [done, setDone] = useState(false);
  const [reflectTrigger, setReflectTrigger] = useState(0);
  const [stats, setStats] = useState<{ cycles: number; sec: number } | null>(null);

  const handleComplete = (cycles: number, sec: number) => {
    setStats({ cycles, sec });
    saveBreathingSession({
      id: `bs_${Date.now()}`,
      createdAt: Date.now(),
      durationSec: sec,
      cycles,
    });
    const latest = getLatestCheckIn();
    saveMindSession({
      id: `ms_${Date.now()}`,
      createdAt: Date.now(),
      intervention: "breathing",
      startLevel: latest?.level ?? 0.5,
      endLevel: latest ? Math.max(0, latest.level - 0.15) : undefined,
    });
    setDone(true);
    setReflectTrigger(Date.now());
  };

  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-10 sm:py-14">
      <Link
        href="/mind"
        className="inline-flex items-center gap-1.5 text-[12px] mind-text-secondary hover:text-[#6FFFE9] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Mind
      </Link>

      <div className="mt-4 mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mind-text-primary">
          Paced breathing
        </h1>
        <p className="mt-2 text-[14px] mind-text-secondary">
          Inhale 4 · Hold 4 · Exhale 6. Follow the circle for two minutes.
        </p>
      </div>

      <div className="flex justify-center">
        {!done ? (
          <BreathingWidget durationSec={120} onComplete={handleComplete} />
        ) : (
          <div className="w-full space-y-6">
            <div className="mind-card-elev rounded-3xl p-7 text-center">
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6FFFE9]">
                Session complete
              </div>
              <h2 className="mt-3 text-3xl font-bold mind-gradient-text">
                Nicely done
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
                    Cycles
                  </div>
                  <div className="text-2xl font-bold tabular-nums mind-text-primary">
                    {stats?.cycles ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
                    Duration
                  </div>
                  <div className="text-2xl font-bold tabular-nums mind-text-primary">
                    {stats ? `${Math.floor(stats.sec / 60)}:${String(stats.sec % 60).padStart(2, "0")}` : "–"}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                  href="/mind/journal"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6FFFE9] to-[#5BC0BE] px-5 py-2.5 text-sm font-bold text-[#0B132B] hover:brightness-110 transition-all"
                >
                  Reflect in journal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/mind"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-sm font-medium mind-text-secondary hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>

            <AIReflectionPanel mode="post_breathing" trigger={reflectTrigger} />
          </div>
        )}
      </div>
    </main>
  );
}
