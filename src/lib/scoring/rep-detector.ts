import { ExerciseConfig, Landmark, RepResult, JointFeedback } from "@/types";
import { getCommonAngles } from "@/lib/pose/angle-utils";

export class RepDetector {
  private config: ExerciseConfig;
  private prevPhase: string = "";
  private phaseHistory: string[] = [];
  private currentIssues: JointFeedback[] = [];
  private scoreAccumulator: number[] = [];
  private repCount: number = 0;
  private inRep: boolean = false;

  constructor(config: ExerciseConfig) {
    this.config = config;
  }

  reset() {
    this.prevPhase = "";
    this.phaseHistory = [];
    this.currentIssues = [];
    this.scoreAccumulator = [];
    this.repCount = 0;
    this.inRep = false;
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
    const angles = getCommonAngles(landmarks);
    const phase = this.config.detectPhase(angles, landmarks);
    const { score, issues } = this.config.scoreRep(angles, landmarks, phase);
    const cues = this.config.getCoachingCues(angles, landmarks, phase);

    this.currentIssues = [...this.currentIssues, ...issues];
    this.scoreAccumulator.push(score);

    let repCompleted = false;
    let repResult: RepResult | undefined;

    // Rep detection: detect a full cycle returning to the first phase
    const phases = this.config.phases;

    if (phase !== this.prevPhase) {
      this.phaseHistory.push(phase);

      // For plank, don't count reps (it's a hold)
      if (this.config.id === "plank") {
        // No rep counting for plank
      } else {
        // A rep is completed when we return to the starting phase after visiting at least one other phase
        if (phases.length >= 2) {
          const startPhase = phases[0];
          const midPhases = phases.slice(1);

          if (!this.inRep && midPhases.includes(phase)) {
            this.inRep = true;
            this.currentIssues = [];
            this.scoreAccumulator = [score];
          }

          if (this.inRep && phase === startPhase) {
            this.repCount++;
            this.inRep = false;

            const avgScore = Math.round(
              this.scoreAccumulator.reduce((a, b) => a + b, 0) / this.scoreAccumulator.length
            );

            // Deduplicate issues
            const uniqueIssues = this.deduplicateIssues(this.currentIssues);

            repResult = {
              score: avgScore,
              issues: uniqueIssues,
              timestamp: Date.now(),
            };
            repCompleted = true;
            this.currentIssues = [];
            this.scoreAccumulator = [];
          }
        }
      }
    }

    this.prevPhase = phase;

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
