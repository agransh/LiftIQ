"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleDot, Wind } from "lucide-react";
import { breathingPaceSignal, estimateBpm, selfReportSignal } from "@/lib/mind/signal";
import { combineSignals } from "@/lib/mind/intervention";
import type { StressSignal } from "@/lib/mind/types";

interface Props {
  onChange: (state: {
    rating: number;
    bpm: number | null;
    signals: StressSignal[];
    level: number;
    confidence: number;
  }) => void;
}

const MOODS = [
  { id: "calm", label: "Calm", weight: 0.2 },
  { id: "okay", label: "Okay", weight: 0.4 },
  { id: "anxious", label: "Anxious", weight: 0.7 },
  { id: "overwhelmed", label: "Overwhelmed", weight: 0.85 },
  { id: "tired", label: "Tired", weight: 0.55 },
];

export function StressCheckInCard({ onChange }: Props) {
  const [rating, setRating] = useState(4);
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const lastEmit = useRef("");

  // Recompute signals whenever inputs change.
  useEffect(() => {
    const signals: StressSignal[] = [selfReportSignal(rating)];
    if (bpm !== null) signals.push(breathingPaceSignal(bpm));
    const { level, confidence } = combineSignals(signals);
    const key = `${rating}|${bpm ?? "_"}|${mood ?? "_"}`;
    if (key !== lastEmit.current) {
      lastEmit.current = key;
      onChange({ rating, bpm, signals, level, confidence });
    }
  }, [rating, bpm, mood, onChange]);

  const handleTap = () => {
    const next = [...taps, Date.now()].slice(-7);
    setTaps(next);
    const est = estimateBpm(next);
    if (est !== null) setBpm(Math.round(est));
  };

  const resetTaps = () => {
    setTaps([]);
    setBpm(null);
  };

  return (
    <div className="space-y-5">
      {/* Self-report slider */}
      <div className="mind-card rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-[#6FFFE9]" />
          <h3 className="text-sm font-semibold mind-text-primary">
            How stressed do you feel right now?
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mind-range w-full"
            aria-label="Stress level 0 to 10"
          />
          <div className="w-14 text-right">
            <div className="text-2xl font-bold tabular-nums text-[#6FFFE9]">{rating}</div>
            <div className="text-[10px] mind-text-secondary">/ 10</div>
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] mind-text-secondary">
          <span>Very calm</span>
          <span>Highly stressed</span>
        </div>

        {/* Mood chips */}
        <div className="mt-5">
          <div className="text-[11px] mind-text-secondary mb-2">One word that fits?</div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const active = mood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMood(active ? null : m.id);
                    if (!active) setRating(Math.round(m.weight * 10));
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${
                    active
                      ? "border-[#6FFFE9]/50 bg-[#6FFFE9]/10 text-[#6FFFE9] shadow-[0_0_18px_-6px_rgba(111,255,233,0.6)]"
                      : "border-white/[0.08] bg-white/[0.02] mind-text-secondary hover:text-white hover:border-white/[0.16]"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breathing pace tap */}
      <div className="mind-card rounded-2xl p-6">
        <div className="mb-3 flex items-center gap-2">
          <Wind className="h-4 w-4 text-[#6FFFE9]" />
          <h3 className="text-sm font-semibold mind-text-primary">
            Tap once for each breath you take
          </h3>
        </div>
        <p className="text-[12px] mind-text-secondary mb-4">
          We&apos;ll estimate your breaths-per-minute. Tap 3+ times for a reading.
        </p>
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            onClick={handleTap}
            className="relative h-20 w-20 shrink-0 rounded-full border border-[#6FFFE9]/30 bg-gradient-to-br from-[#6FFFE9]/15 to-[#5BC0BE]/10 text-[#6FFFE9] font-semibold transition-all hover:bg-[#6FFFE9]/20 active:bg-[#6FFFE9]/25 shadow-[0_0_28px_-8px_rgba(111,255,233,0.55)]"
          >
            Tap
          </motion.button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
              Estimated rate
            </div>
            <div className="text-2xl font-bold tabular-nums mind-text-primary">
              {bpm !== null ? `${bpm} bpm` : "—"}
            </div>
            <div className="mt-1 text-[11px] mind-text-secondary">
              {bpm === null
                ? "Waiting for taps…"
                : bpm < 14
                  ? "Slow & steady"
                  : bpm < 22
                    ? "In a normal range"
                    : "On the faster side"}
            </div>
          </div>
          <button
            type="button"
            onClick={resetTaps}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] mind-text-secondary hover:text-white hover:border-white/[0.16]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Inline range styling — scoped via class */}
      <style jsx>{`
        .mind-range {
          appearance: none;
          background: linear-gradient(
            90deg,
            #6fffe9 0%,
            #5bc0be ${rating * 10}%,
            rgba(255, 255, 255, 0.08) ${rating * 10}%,
            rgba(255, 255, 255, 0.08) 100%
          );
          height: 6px;
          border-radius: 999px;
          outline: none;
        }
        .mind-range::-webkit-slider-thumb {
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: linear-gradient(180deg, #ffffff, #c8fff6);
          border: 2px solid #6fffe9;
          box-shadow: 0 0 18px -2px rgba(111, 255, 233, 0.65);
          cursor: pointer;
        }
        .mind-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: linear-gradient(180deg, #ffffff, #c8fff6);
          border: 2px solid #6fffe9;
          box-shadow: 0 0 18px -2px rgba(111, 255, 233, 0.65);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
