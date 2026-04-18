"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { StressMeter } from "./stress-meter";

interface Props {
  level: number;
  intervention: string;
  topLine: string;
  ctaLabel: string;
  ctaHref: string;
}

export function SessionSummary({
  level,
  intervention,
  topLine,
  ctaLabel,
  ctaHref,
}: Props) {
  return (
    <div className="mind-card-elev rounded-3xl p-7">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#6FFFE9]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6FFFE9]">
          Suggested next step
        </span>
      </div>
      <h3 className="mind-gradient-text text-2xl sm:text-3xl font-bold tracking-tight">
        {topLine}
      </h3>
      <p className="mt-2 text-[13px] mind-text-secondary capitalize">
        Routed to: <span className="text-[#6FFFE9]">{intervention}</span>
      </p>
      <div className="mt-5">
        <StressMeter level={level} size="lg" />
      </div>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6FFFE9] to-[#5BC0BE] px-6 py-3 text-sm font-bold text-[#0B132B] shadow-[0_0_36px_-8px_rgba(111,255,233,0.6)] transition-all hover:brightness-110"
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
