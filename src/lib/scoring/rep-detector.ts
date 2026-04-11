import { ExerciseConfig, Landmark, RepResult, JointFeedback } from "@/types";
import { getCommonAngles } from "@/lib/pose/angle-utils";

/** Consecutive matching raw frames before stable phase updates. */
const PHASE_STABILITY_FRAMES = 3;
/** Min gap between counted reps — prevents jitter double-counts without dropping fast sets. */
const REP_COOLDOWN_MS = 600;
const ANGLE_SMOOTHING_WINDOW = 3;
/** Minimum frames spent in deep phase before a rep-return can count. Prevents flyby triggers. */
const MIN_DEEP_FRAMES = 2;

export class RepDetector {
  private config: ExerciseConfig;
  private prevPhase: string = "";
  private stablePhase: string = "";
  private phaseCounter: number = 0;
  private currentIssues: JointFeedback[] = [];
  private scoreAccumulator: number[] = [];
  private repCount: number = 0;
  private inRep: boolean = false;
  private reachedDeepPhase: boolean = false;
  private deepFrameCount: number = 0;
  private lastRepTime: number = 0;
  private angleHistory: Record<string, number>[] = [];

  constructor(config: ExerciseConfig) {
    this.config = config;
  }

  reset() {
    this.prevPhase = "";
    this.stablePhase = "";
    this.phaseCounter = 0;
    this.currentIssues = [];
    this.scoreAccumulator = [];
    this.repCount = 0;
    this.inRep = false;
    this.reachedDeepPhase = false;
    this.deepFrameCount = 0;
    this.lastRepTime = 0;
    this.angleHistory = [];
  }

  private smoothAngles(angles: Record<string, number>): Record<string, number> {
    this.angleHistory.push(angles);
    if (this.angleHistory.length > ANGLE_SMOOTHING_WINDOW) {
      this.angleHistory.shift();
    }
    if (this.angleHistory.length < 2) return angles;

    const smoothed: Record<string, number> = {};
    for (const key of Object.keys(angles)) {
      const values = this.angleHistory.map((a) => a[key]);
      smoothed[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }
    return smoothed;
  }

  private getDeepPhase(): string {
    const phases = this.config.phases;
    if (phases.length <= 2) return phases[phases.length - 1];
    // The deepest phase is the peak-effort point in the movement cycle:
    // 3-phase [start, transit, peak]: last phase (index 2)
    // 4-phase [start, down, bottom, up]: middle phase (index 2)
    return phases[Math.min(phases.length - 1, 2)];
  }

  private getStablePhase(rawPhase: string): string {
    if (rawPhase === this.prevPhase) {
      this.phaseCounter++;
    } else {
      this.phaseCounter = 1;
    }
    this.prevPhase = rawPhase;

    if (this.phaseCounter >= PHASE_STABILITY_FRAMES) {
      this.stablePhase = rawPhase;
    }
    return this.stablePhase;
  }

  update(landmarks: Landmark[]): {
    phase: string;
    score: number;
    issues: JointFeedback[];
    cues: string[];
    repCompleted: boolean;
    repResult?: RepResult;
    repCount: number;
  } {
    const rawAngles = getCommonAngles(landmarks);
    const smoothedAngles = this.smoothAngles(rawAngles);

    // Phase detection uses RAW angles so brief positions (e.g. squat bottom) aren't averaged away.
    const rawPhase = this.config.detectPhase(rawAngles, landmarks);
    const phase = this.getStablePhase(rawPhase);
    const deepPhase = this.getDeepPhase();

    // Scoring/cues use smoothed angles for less noisy feedback.
    const { score, issues } = this.config.scoreRep(smoothedAngles, landmarks, phase);
    const cues = this.config.getCoachingCues(smoothedAngles, landmarks, phase);

    this.currentIssues = [...this.currentIssues, ...issues];
    this.scoreAccumulator.push(score);

    let repCompleted = false;
    let repResult: RepResult | undefined;

    const phases = this.config.phases;

    if (this.config.id === "plank") {
      // No rep counting for holds
    } else if (phases.length >= 2 && phase !== "") {
      const startPhase = phases[0];
      const midPhases = phases.slice(1);

      if (!this.inRep && (midPhases.includes(phase) || midPhases.includes(rawPhase))) {
        this.inRep = true;
        this.reachedDeepPhase = false;
        this.deepFrameCount = 0;
        this.currentIssues = [];
        this.scoreAccumulator = [score];
      }

      // Track time spent in deep phase to filter out flyby transitions
      if (this.inRep && (rawPhase === deepPhase || phase === deepPhase)) {
        this.deepFrameCount++;
        if (this.deepFrameCount >= MIN_DEEP_FRAMES) {
          this.reachedDeepPhase = true;
        }
      }

      if (this.inRep && phase === startPhase && this.reachedDeepPhase && this.scoreAccumulator.length >= 4) {
        const now = Date.now();
        if (now - this.lastRepTime > REP_COOLDOWN_MS) {
          this.repCount++;
          this.lastRepTime = now;

          const avgScore = Math.round(
            this.scoreAccumulator.reduce((a, b) => a + b, 0) / this.scoreAccumulator.length
          );

          const uniqueIssues = this.deduplicateIssues(this.currentIssues);

          repResult = {
            score: avgScore,
            issues: uniqueIssues,
            timestamp: now,
          };
          repCompleted = true;

          this.inRep = false;
          this.reachedDeepPhase = false;
          this.deepFrameCount = 0;
          this.currentIssues = [];
          this.scoreAccumulator = [];
        }
        // If cooldown blocked the count, DON'T reset the cycle — keep inRep
        // so the movement can still be counted once cooldown expires.
      }
    }

    return {
      phase,
      score,
      issues,
      cues,
      repCompleted,
      repResult,
      repCount: this.repCount,
    };
  }

  private deduplicateIssues(issues: JointFeedback[]): JointFeedback[] {
    const seen = new Map<string, JointFeedback>();
    for (const issue of issues) {
      const key = `${issue.joint}-${issue.message}`;
      if (!seen.has(key) || issue.status === "poor") {
        seen.set(key, issue);
      }
    }
    return Array.from(seen.values());
  }

  getRepCount(): number {
    return this.repCount;
  }
}
