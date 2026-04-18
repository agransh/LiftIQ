"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "in" | "hold" | "out";

const PHASE_SEC: Record<Phase, number> = { in: 4, hold: 4, out: 6 };
const PHASE_LABEL: Record<Phase, string> = {
  in: "Breathe in",
  hold: "Hold",
  out: "Breathe out",
};
const ORDER: Phase[] = ["in", "hold", "out"];

interface Props {
  /** Total target duration in seconds (defaults to 2 minutes). */
  durationSec?: number;
  onComplete?: (cyclesCompleted: number, elapsedSec: number) => void;
  autoStart?: boolean;
}

export function BreathingWidget({
  durationSec = 120,
  onComplete,
  autoStart = true,
}: Props) {
  const [running, setRunning] = useState(autoStart);
  const [phase, setPhase] = useState<Phase>("in");
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);

  const completedRef = useRef(false);
  const phaseRef = useRef<Phase>("in");
  const phaseElapsedRef = useRef(0);
  const totalElapsedRef = useRef(0);
  const cyclesRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Single rAF loop drives time, phase advancement, and completion.
  // setState calls happen inside the rAF callback (event-like context),
  // not synchronously in the effect body.
  useEffect(() => {
    if (!running) return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      phaseElapsedRef.current += dt;
      totalElapsedRef.current += dt;

      // Phase advance
      if (phaseElapsedRef.current >= PHASE_SEC[phaseRef.current]) {
        const idx = ORDER.indexOf(phaseRef.current);
        const next = ORDER[(idx + 1) % ORDER.length];
        phaseRef.current = next;
        phaseElapsedRef.current = 0;
        if (next === "in") {
          cyclesRef.current += 1;
          setCycles(cyclesRef.current);
        }
        setPhase(next);
      }

      setPhaseElapsed(phaseElapsedRef.current);
      setTotalElapsed(totalElapsedRef.current);

      // Completion
      if (!completedRef.current && totalElapsedRef.current >= durationSec) {
        completedRef.current = true;
        setRunning(false);
        onCompleteRef.current?.(cyclesRef.current, Math.round(totalElapsedRef.current));
        return; // stop scheduling
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running, durationSec]);

  const phaseProgress = Math.min(1, phaseElapsed / PHASE_SEC[phase]);
  // Scale: inhale 0.6→1.0, hold 1.0, exhale 1.0→0.6
  const scale =
    phase === "in"
      ? 0.6 + 0.4 * easeInOut(phaseProgress)
      : phase === "hold"
        ? 1.0
        : 1.0 - 0.4 * easeInOut(phaseProgress);

  const remaining = Math.max(0, Math.ceil(durationSec - totalElapsed));
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      {/* Centerpiece circle */}
      <div className="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[400px] sm:w-[400px]">
        {/* Outer halo */}
        <motion.div
          aria-hidden
          className="absolute h-full w-full rounded-full bg-[radial-gradient(circle,rgba(111,255,233,0.18),transparent_60%)] blur-2xl"
          animate={{ scale: 0.7 + 0.3 * scale, opacity: 0.4 + 0.5 * scale }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
        {/* Soft ring */}
        <motion.div
          aria-hidden
          className="absolute rounded-full border border-[#6FFFE9]/25"
          animate={{
            width: 260 + 80 * scale,
            height: 260 + 80 * scale,
            opacity: 0.35 + 0.45 * scale,
          }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
        {/* Main breathing circle */}
        <motion.div
          aria-hidden
          className="absolute rounded-full bg-gradient-to-br from-[#6FFFE9]/30 via-[#5BC0BE]/25 to-[#1C2541]/40 backdrop-blur-xl border border-[#6FFFE9]/30 shadow-[0_0_60px_-10px_rgba(111,255,233,0.6)]"
          animate={{
            width: 180 + 140 * scale,
            height: 180 + 140 * scale,
          }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
        {/* Inner core */}
        <motion.div
          aria-hidden
          className="absolute rounded-full bg-gradient-to-br from-[#6FFFE9]/60 to-[#5BC0BE]/30"
          animate={{
            width: 70 + 60 * scale,
            height: 70 + 60 * scale,
            opacity: 0.6 + 0.3 * scale,
          }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
        {/* Phase label */}
        <div className="relative z-10 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-2xl sm:text-3xl font-semibold tracking-tight mind-text-primary"
            >
              {PHASE_LABEL[phase]}
            </motion.div>
          </AnimatePresence>
          <div className="mt-2 text-[11px] uppercase tracking-[0.25em] mind-text-secondary">
            {Math.max(1, Math.ceil(PHASE_SEC[phase] - phaseElapsed))}s
          </div>
        </div>
      </div>

      {/* Footer controls + timer */}
      <div className="mt-8 flex w-full max-w-md items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
            Remaining
          </div>
          <div className="text-2xl font-bold tabular-nums mind-text-primary">
            {mm}:{ss}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">
            Cycles
          </div>
          <div className="text-2xl font-bold tabular-nums mind-text-primary">
            {cycles}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/10 px-5 py-2.5 text-sm font-semibold text-[#6FFFE9] transition-all hover:bg-[#6FFFE9]/15 hover:shadow-[0_0_24px_-6px_rgba(111,255,233,0.5)]"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={() => {
            completedRef.current = true;
            setRunning(false);
            onComplete?.(cycles, Math.round(totalElapsed));
          }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium mind-text-secondary transition-all hover:bg-white/[0.06] hover:text-white"
        >
          Finish early
        </button>
      </div>
    </div>
  );
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
