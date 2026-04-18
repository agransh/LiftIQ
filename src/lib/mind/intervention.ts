import type { InterventionKind, StressSignal } from "./types";

/**
 * Routing thresholds. Tuned for a calm-by-default UX:
 * < 0.4   → light reflection / journaling
 * 0.4–0.7 → guided breathing
 * > 0.7   → grounding + support resources (NEVER "treatment")
 */
export function getIntervention(level: number): InterventionKind {
  if (level < 0.4) return "reflection";
  if (level < 0.7) return "breathing";
  return "support";
}

/** Confidence-weighted mean of multiple stress signals. */
export function combineSignals(signals: StressSignal[]): {
  level: number;
  confidence: number;
} {
  if (signals.length === 0) return { level: 0, confidence: 0 };
  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of signals) {
    const w = Math.max(0.05, s.confidence); // floor so a 0-confidence signal still nudges
    weightedSum += s.value * w;
    totalWeight += w;
  }
  const level = clamp01(weightedSum / totalWeight);
  const confidence = clamp01(
    signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length,
  );
  return { level, confidence };
}

export function levelLabel(level: number): { label: string; tone: "calm" | "elevated" | "high" } {
  if (level < 0.4) return { label: "Calm", tone: "calm" };
  if (level < 0.7) return { label: "Elevated", tone: "elevated" };
  return { label: "High", tone: "high" };
}

export function interventionCopy(kind: InterventionKind): {
  title: string;
  blurb: string;
  cta: string;
  href: string;
} {
  switch (kind) {
    case "reflection":
      return {
        title: "A short reflection",
        blurb:
          "You're in a calm range. A quick journaling prompt can help you stay grounded and notice what's going well.",
        cta: "Open journal",
        href: "/mind/journal",
      };
    case "breathing":
      return {
        title: "Let's slow the breath",
        blurb:
          "Your stress is a little elevated. A 2-minute paced breathing session usually helps the body settle.",
        cta: "Start breathing",
        href: "/mind/breathe",
      };
    case "support":
      return {
        title: "Take a pause",
        blurb:
          "You're carrying a lot right now. Try a brief grounding exercise — and remember support is available.",
        cta: "Open support",
        href: "/mind/support",
      };
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
