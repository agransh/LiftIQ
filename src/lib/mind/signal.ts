import type { StressSignal } from "./types";

/**
 * Build a self-report signal from a 0–10 slider.
 * Confidence is high — the user told us directly.
 */
export function selfReportSignal(rating0to10: number): StressSignal {
  const value = clamp01(rating0to10 / 10);
  return { source: "self_report", value, confidence: 0.9 };
}

/**
 * Build a breathing-pace signal from breaths-per-minute.
 *
 * Resting adult range is roughly 12–20 BPM. We map:
 *   <= 8 BPM   → 0.0 (very calm, possibly meditative)
 *   12 BPM     → 0.2
 *   18 BPM     → 0.5
 *   24 BPM     → 0.8
 *   >= 30 BPM  → 1.0 (highly elevated)
 *
 * Confidence is moderate (0.55) — manual tap timing is noisy.
 */
export function breathingPaceSignal(bpm: number): StressSignal {
  const clamped = Math.max(4, Math.min(40, bpm));
  // Piecewise-linear interpolation
  const value = clamp01((clamped - 8) / 22);
  return { source: "breathing", value, confidence: 0.55 };
}

/**
 * DEMO ONLY — simulated camera/PPG signal. Not a real measurement.
 * Returns a small random walk around a target value, useful for stage demos.
 */
export function simulatedSignal(target = 0.5, jitter = 0.1): StressSignal {
  const value = clamp01(target + (Math.random() - 0.5) * 2 * jitter);
  return { source: "simulated", value, confidence: 0.25 };
}

/**
 * Estimate breaths per minute from an array of tap timestamps (ms since epoch).
 * Needs at least 2 taps; uses the last 6 intervals for stability.
 */
export function estimateBpm(timestampsMs: number[]): number | null {
  if (timestampsMs.length < 2) return null;
  const recent = timestampsMs.slice(-7);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    intervals.push(recent[i] - recent[i - 1]);
  }
  const meanMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (meanMs <= 0) return null;
  return 60_000 / meanMs;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
