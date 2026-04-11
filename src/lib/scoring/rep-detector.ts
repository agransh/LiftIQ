import { ExerciseConfig, Landmark, RepResult, JointFeedback } from "@/types";
import { getCommonAngles } from "@/lib/pose/angle-utils";

/** Consecutive matching raw frames before stable phase updates (lower = snappier rep detection). */
const PHASE_STABILITY_FRAMES = 2;
/** Min gap between counted reps — too high drops fast sets; too low risks double-count from pose jitter. */
const REP_COOLDOWN_MS = 200;
const ANGLE_SMOOTHING_WINDOW = 3;

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
    const angles = this.smoothAngles(rawAngles);
    const rawPhase = this.config.detectPhase(angles, landmarks);
    const phase = this.getStablePhase(rawPhase);
    const deepPhase = this.getDeepPhase();
    const { score, issues } = this.config.scoreRep(angles, landmarks, phase);
    const cues = this.config.getCoachingCues(angles, landmarks, phase);

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

      if (!this.inRep && midPhases.includes(phase)) {
        this.inRep = true;
        this.reachedDeepPhase = false;
        this.currentIssues = [];
        this.scoreAccumulator = [score];
      }

      // Use raw phase for "hit bottom" — stable phase can lag 2+ frames and miss short pauses at depth.
      if (this.inRep && rawPhase === deepPhase) {
        this.reachedDeepPhase = true;
      }

      if (this.inRep && phase === startPhase && this.reachedDeepPhase) {
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
        }
        this.inRep = false;
        this.reachedDeepPhase = false;
        this.currentIssues = [];
        this.scoreAccumulator = [];
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
