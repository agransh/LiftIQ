"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StressCheckInCard } from "@/components/mind/stress-check-in-card";
import { SignalStatusCard } from "@/components/mind/signal-status-card";
import { SessionSummary } from "@/components/mind/session-summary";
import { AIReflectionPanel } from "@/components/mind/ai-reflection-panel";
import {
  getIntervention,
  interventionCopy,
} from "@/lib/mind/intervention";
import { saveCheckIn, saveMindSession } from "@/lib/mind/storage";
import type { StressSignal } from "@/lib/mind/types";

export default function CheckInPage() {
  const router = useRouter();
  const [state, setState] = useState<{
    rating: number;
    bpm: number | null;
    signals: StressSignal[];
    level: number;
    confidence: number;
  }>({
    rating: 4,
    bpm: null,
    signals: [],
    level: 0.4,
    confidence: 0.9,
  });
  const [reflectTrigger, setReflectTrigger] = useState(0);
  const [committed, setCommitted] = useState(false);

  const onChange = useCallback(
    (s: typeof state) => setState(s),
    [],
  );

  const intervention = getIntervention(state.level);
  const copy = interventionCopy(intervention);

  const handleContinue = () => {
    const id = `ci_${Date.now()}`;
    saveCheckIn({
      id,
      createdAt: Date.now(),
      signals: state.signals,
      level: state.level,
      confidence: state.confidence,
      intervention,
    });
    saveMindSession({
      id: `ms_${Date.now()}`,
      createdAt: Date.now(),
      intervention,
      startLevel: state.level,
    });
    router.push(copy.href);
  };

  const handleReflect = () => {
    setCommitted(true);
    setReflectTrigger(Date.now());
  };

  return (
    <main className="mx-auto min-w-0 max-w-5xl px-4 py-8 pt-[max(2.5rem,calc(1.25rem+var(--safe-top)))] sm:px-6 sm:py-14 lg:px-8">
      <Link
        href="/mind"
        className="inline-flex items-center gap-1.5 text-[12px] mind-text-secondary hover:text-[#6FFFE9] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Mind
      </Link>

      <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-[-0.03em] mind-text-primary">
        Check in with yourself
      </h1>
      <p className="mt-2 max-w-xl text-[14px] mind-text-secondary">
        Tell us how you feel and tap with your breath. We&apos;ll route you to whatever fits — reflection, breathing, or grounding support.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,360px]">
        <div>
          <StressCheckInCard onChange={onChange} />

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReflect}
              className="rounded-2xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/10 px-5 py-2.5 text-sm font-semibold text-[#6FFFE9] hover:bg-[#6FFFE9]/15 transition-all"
            >
              Get a reflection
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="rounded-2xl bg-gradient-to-r from-[#6FFFE9] to-[#5BC0BE] px-6 py-2.5 text-sm font-bold text-[#0B132B] shadow-[0_0_28px_-8px_rgba(111,255,233,0.55)] hover:brightness-110 transition-all"
            >
              {copy.cta} →
            </button>
          </div>

          {committed && (
            <div className="mt-6">
              <AIReflectionPanel
                mode="checkin"
                level={state.level}
                trigger={reflectTrigger}
              />
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <SessionSummary
            level={state.level}
            intervention={intervention}
            topLine={copy.title}
            ctaLabel={copy.cta}
            ctaHref={copy.href}
          />
          <SignalStatusCard signals={state.signals} />
        </aside>
      </div>
    </main>
  );
}
