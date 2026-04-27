"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "in" | "hold" | "out";

const PHASE_SEC: Record<Phase, number> = { in: 4, hold: 4, out: 6 };
const CYCLE_SEC = PHASE_SEC.in + PHASE_SEC.hold + PHASE_SEC.out;
const PHASE_LABEL: Record<Phase, string> = {
  in: "Breathe in",
  hold: "Hold",
  out: "Breathe out",
};

/** Derive phase from total elapsed (wall clock); not affected by throttled rAF/interval in background. */
function stateAt(elapsedSec: number): { phase: Phase; phaseElapsed: number; cycles: number } {
  const t = Math.max(0, elapsedSec);
  const cycles = Math.floor(t / CYCLE_SEC);
  const u = t % CYCLE_SEC;
  if (u < PHASE_SEC.in) {
    return { phase: "in", phaseElapsed: u, cycles };
  }
  if (u < PHASE_SEC.in + PHASE_SEC.hold) {
    return { phase: "hold", phaseElapsed: u - PHASE_SEC.in, cycles };
  }
  return { phase: "out", phaseElapsed: u - PHASE_SEC.in - PHASE_SEC.hold, cycles };
}

const DESIGN = 400;
const R_SOFT = 260;
const R_MAIN = 180;
const R_CORE = 70;
const D_SOFT = 80;
const D_MAIN = 140;
const D_CORE = 60;

interface Props {
  durationSec?: number;
  onComplete?: (cyclesCompleted: number, elapsedSec: number) => void;
  autoStart?: boolean;
}

export function BreathingWidget({
  durationSec = 120,
  onComplete,
  autoStart = true,
}: Props) {
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const [sessionDone, setSessionDone] = useState(false);

  const notStartedRef = useRef(!autoStart);
  const sessionStart = useRef(Date.now());
  const pausedTotalMs = useRef(0);
  const pauseAt = useRef<number | null>(autoStart ? null : Date.now());
  const onCompleteRef = useRef(onComplete);
  const endedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [diameter, setDiameter] = useState(DESIGN);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w > 0) setDiameter(w);
    });
    ro.observe(el);
    if (el.clientWidth > 0) setDiameter(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Wall clock + background tab: refresh on interval and when the tab is visible again.
  useEffect(() => {
    if (sessionDone) return;
    const id = setInterval(() => {
      setTick((n) => n + 1);
    }, 200);
    return () => clearInterval(id);
  }, [sessionDone]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        setTick((n) => n + 1);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const getElapsedSec = useCallback(() => {
    if (notStartedRef.current) return 0;
    if (pauseAt.current != null) {
      return (pauseAt.current - sessionStart.current - pausedTotalMs.current) / 1000;
    }
    return (Date.now() - sessionStart.current - pausedTotalMs.current) / 1000;
  }, []);

  const fireComplete = useCallback((cycles: number, sec: number) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSessionDone(true);
    setRunning(false);
    onCompleteRef.current?.(cycles, sec);
  }, []);

  useEffect(() => {
    if (sessionDone || endedRef.current) return;
    if (notStartedRef.current) return;
    const t = getElapsedSec();
    if (t < durationSec) return;
    const { cycles: c } = stateAt(durationSec);
    fireComplete(c, Math.round(durationSec));
  }, [tick, sessionDone, durationSec, getElapsedSec, fireComplete]);

  const totalElapsed = sessionDone
    ? durationSec
    : Math.min(durationSec, getElapsedSec());
  const { phase, phaseElapsed, cycles } = stateAt(totalElapsed);
  const phaseProgress = Math.min(1, phaseElapsed / PHASE_SEC[phase]);
  const scale =
    phase === "in"
      ? 0.6 + 0.4 * easeInOut(phaseProgress)
      : phase === "hold"
        ? 1.0
        : 1.0 - 0.4 * easeInOut(phaseProgress);

  const k = Math.max(0.55, Math.min(1.15, diameter / DESIGN));
  const remaining = Math.max(0, Math.ceil(durationSec - totalElapsed));
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const setPaused = (shouldPause: boolean) => {
    if (sessionDone || endedRef.current) return;
    if (shouldPause) {
      if (!running) return;
      pauseAt.current = Date.now();
      setRunning(false);
      return;
    }
    if (running) return;
    if (notStartedRef.current) {
      notStartedRef.current = false;
      sessionStart.current = Date.now();
      pauseAt.current = null;
      pausedTotalMs.current = 0;
      setRunning(true);
      return;
    }
    if (pauseAt.current != null) {
      pausedTotalMs.current += Date.now() - pauseAt.current;
      pauseAt.current = null;
    }
    setRunning(true);
  };

  const handleFinishEarly = () => {
    if (sessionDone || endedRef.current) return;
    const t = getElapsedSec();
    const { cycles: c } = stateAt(t);
    fireComplete(c, Math.round(Math.min(t, durationSec)));
  };

  return (
    <div className="flex w-full min-w-0 max-w-md flex-col items-center">
      <div
        ref={containerRef}
        className="relative mx-auto flex aspect-square w-full max-w-[min(100%,26rem)] items-center justify-center"
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: diameter, height: diameter }}
        >
          <motion.div
            aria-hidden
            className="absolute h-full w-full rounded-full bg-[radial-gradient(circle,rgba(111,255,233,0.18),transparent_60%)] blur-2xl"
            animate={{ scale: 0.7 + 0.3 * scale, opacity: 0.4 + 0.5 * scale }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
          <motion.div
            aria-hidden
            className="absolute rounded-full border border-[#6FFFE9]/25"
            style={{ width: (R_SOFT + D_SOFT * scale) * k, height: (R_SOFT + D_SOFT * scale) * k }}
            animate={{ opacity: 0.35 + 0.45 * scale }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
          <motion.div
            aria-hidden
            className="absolute rounded-full bg-gradient-to-br from-[#6FFFE9]/30 via-[#5BC0BE]/25 to-[#1C2541]/40 backdrop-blur-xl border border-[#6FFFE9]/30 shadow-[0_0_60px_-10px_rgba(111,255,233,0.6)]"
            style={{ width: (R_MAIN + D_MAIN * scale) * k, height: (R_MAIN + D_MAIN * scale) * k }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
          <motion.div
            aria-hidden
            className="absolute rounded-full bg-gradient-to-br from-[#6FFFE9]/60 to-[#5BC0BE]/30"
            style={{ width: (R_CORE + D_CORE * scale) * k, height: (R_CORE + D_CORE * scale) * k }}
            animate={{ opacity: 0.6 + 0.3 * scale }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
          <div className="relative z-10 max-w-[90%] text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-semibold tracking-tight mind-text-primary sm:text-2xl md:text-3xl"
              >
                {PHASE_LABEL[phase]}
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 text-[10px] uppercase tracking-[0.25em] mind-text-secondary sm:text-[11px]">
              {sessionDone
                ? "0s"
                : `${Math.max(1, Math.ceil(PHASE_SEC[phase] - phaseElapsed))}s`}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 max-w-sm px-1 text-center text-[11px] text-white/35 sm:hidden" aria-hidden>
        Timer uses your device clock so it stays accurate in the background.
      </p>

      <div className="mt-6 flex w-full max-w-md items-center justify-between gap-4 px-1">
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">Remaining</div>
          <div className="text-2xl font-bold tabular-nums mind-text-primary">
            {mm}:{ss}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] mind-text-secondary">Cycles</div>
          <div className="text-2xl font-bold tabular-nums mind-text-primary">{cycles}</div>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-md flex-wrap justify-center gap-3 sm:px-0">
        <button
          type="button"
          onClick={() => setPaused(running)}
          disabled={sessionDone}
          className="min-h-11 min-w-[6.5rem] touch-manipulation rounded-xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/10 px-5 py-2.5 text-sm font-semibold text-[#6FFFE9] transition-all hover:bg-[#6FFFE9]/15 hover:shadow-[0_0_24px_-6px_rgba(111,255,233,0.5)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={handleFinishEarly}
          disabled={sessionDone}
          className="min-h-11 min-w-[6.5rem] touch-manipulation rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm font-medium mind-text-secondary transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
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
