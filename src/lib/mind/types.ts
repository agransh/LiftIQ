// Mind module — shared types
// All values are normalized 0–1 unless otherwise stated.

export type StressSignalSource =
  | "self_report"
  | "breathing"
  | "camera_ppg"
  /** Legacy: older local sessions may still include this. No longer written by the app. */
  | "simulated";

export interface StressSignal {
  source: StressSignalSource;
  /** Normalized stress 0–1 (0 = calm, 1 = highly stressed). */
  value: number;
  /** How much we trust this reading, 0–1. */
  confidence: number;
}

export type InterventionKind = "reflection" | "breathing" | "support";

export interface CheckIn {
  id: string;
  createdAt: number;
  signals: StressSignal[];
  /** Aggregated normalized stress 0–1. */
  level: number;
  /** Confidence-weighted mean used to make routing decisions. */
  confidence: number;
  intervention: InterventionKind;
  mood?: string;
  note?: string;
}

export interface BreathingSession {
  id: string;
  createdAt: number;
  durationSec: number;
  /** Number of completed inhale–hold–exhale cycles. */
  cycles: number;
  perceivedReliefDelta?: number; // -1..1, optional after-rating
}

export interface JournalEntry {
  id: string;
  createdAt: number;
  prompt?: string;
  body: string;
  /** Optional model-generated reflection (always non-clinical, non-diagnostic). */
  aiReflection?: string;
}

export interface MindSessionSummary {
  id: string;
  createdAt: number;
  intervention: InterventionKind;
  startLevel: number;
  endLevel?: number;
  notes?: string;
}
