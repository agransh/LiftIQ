"use client";

import Link from "next/link";
import { ArrowLeft, Wind } from "lucide-react";
import { SupportResourcesCard } from "@/components/mind/support-resources-card";

export default function SupportPage() {
  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 pt-[max(2.5rem,calc(1.25rem+var(--safe-top)))] sm:px-6 sm:py-14 lg:px-8">
      <Link
        href="/mind"
        className="inline-flex items-center gap-1.5 text-[12px] mind-text-secondary hover:text-[#6FFFE9] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Mind
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mind-text-primary">
          Pause &amp; ground
        </h1>
        <p className="mt-2 text-[14px] mind-text-secondary">
          When stress runs high, the goal isn&apos;t to fix anything — it&apos;s to slow down and feel the room around you. Try a grounding step, then reach out if you need someone.
        </p>
      </div>

      <SupportResourcesCard />

      <div className="mt-8 mind-card-elev rounded-2xl p-6 text-center">
        <p className="text-[14px] mind-text-primary leading-relaxed">
          Once you&apos;re ready, a slow paced breath can help your body settle.
        </p>
        <Link
          href="/mind/breathe"
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/10 px-5 py-2.5 text-sm font-semibold text-[#6FFFE9] hover:bg-[#6FFFE9]/15 transition-all"
        >
          <Wind className="h-4 w-4" />
          Try a 2-minute breath
        </Link>
      </div>
    </main>
  );
}
