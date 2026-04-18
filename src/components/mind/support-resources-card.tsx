"use client";

import { LifeBuoy, Phone, MessageCircle, Globe } from "lucide-react";

const RESOURCES = [
  {
    name: "988 Suicide & Crisis Lifeline (US)",
    detail: "Call or text 988 — free, 24/7",
    icon: Phone,
    href: "tel:988",
  },
  {
    name: "Crisis Text Line",
    detail: "Text HOME to 741741 (US/CA), 85258 (UK)",
    icon: MessageCircle,
    href: "sms:741741?body=HOME",
  },
  {
    name: "Find a Helpline",
    detail: "International directory of crisis lines",
    icon: Globe,
    href: "https://findahelpline.com",
  },
];

const GROUNDING = [
  "Name 5 things you can see right now.",
  "Name 4 things you can physically feel.",
  "Name 3 things you can hear.",
  "Name 2 things you can smell.",
  "Name 1 thing you can taste.",
];

export function SupportResourcesCard() {
  return (
    <div className="space-y-6">
      <div className="mind-card-elev rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-400/20">
            <LifeBuoy className="h-4 w-4 text-rose-300" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-base font-semibold mind-text-primary">You&apos;re not alone</h3>
            <p className="text-[12px] mind-text-secondary">
              If you&apos;re in crisis, please reach a human now.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {RESOURCES.map((r) => (
            <a
              key={r.name}
              href={r.href}
              target={r.href.startsWith("http") ? "_blank" : undefined}
              rel={r.href.startsWith("http") ? "noreferrer" : undefined}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-rose-400/25 hover:bg-rose-500/[0.04]"
            >
              <r.icon className="h-4 w-4 text-rose-300 shrink-0" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium mind-text-primary truncate">
                  {r.name}
                </div>
                <div className="text-[11px] mind-text-secondary truncate">{r.detail}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mind-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold mind-text-primary">5-4-3-2-1 grounding</h3>
        <p className="mt-1 text-[12px] mind-text-secondary">
          Bring your attention back to the room, one sense at a time.
        </p>
        <ol className="mt-4 space-y-2.5">
          {GROUNDING.map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6FFFE9]/10 text-[11px] font-bold text-[#6FFFE9] tabular-nums">
                {5 - i}
              </span>
              <span className="text-[13px] mind-text-primary leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-center text-[11px] mind-text-secondary">
        LiftIQ is a wellness companion, not a medical service. It does not diagnose or treat any condition.
      </p>
    </div>
  );
}
