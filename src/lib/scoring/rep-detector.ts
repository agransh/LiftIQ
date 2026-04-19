import { ExerciseConfig, Landmark, RepResult, JointFeedback, RepCycleConfig } from "@/types";
import { getCommonAngles, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { classifyPoseFamily, PoseFamily } from "@/lib/pose/pose-family";
import { REQUIRED_FAMILY } from "@/lib/exercises/start-validators";
import { FeedbackAggregator, CueStabilizer } from "@/lib/scoring/feedback-aggregator";
import { frameTrust } from "@/lib/pose/landmark-quality";

/**
 * Core landmarks every exercise depends on. Used to compute a per-frame
 * trust score so noisy frames contribute less to the rep's average score.
 */
const CORE_LANDMARKS = [
  L.LEFT_SHOULDER, L.RIGHT_SHOULDER,
  L.LEFT_HIP, L.RIGHT_HIP,
  L.LEFT_KNEE, L.RIGHT_KNEE,
  L.LEFT_ELBOW, L.RIGHT_ELBOW,
];

/** Frame-trust threshold below which we don't accept the frame's issues. */
const MIN_FRAME_TRUST = 0.45;

const ANGLE_SMOOTHING_WINDOW = 5;
const HYSTERESIS_BUFFER = 8;
/** Phase-based rep path (exercises without repCycle): stability frames + cooldown */
const PHASE_STABILITY_FRAMES = 2;
const PHASE_REP_COOLDOWN_MS = 280;
/**
 * Family-drift guard: how many consecutive frames the user must spend in the
 * "wrong" pose family before we drop in-flight rep state. Burpee transitions
 * standing↔plank in a single rep, so this needs to be a real grace window
 * (~0.6s at 30 fps), not 1–2 frames.
 */
const FAMILY_DRIFT_FRAMES = 18;

type CycleState = "idle" | "descending" | "at_depth" | "returning";

export class RepDetector {
  private config: ExerciseConfig;
  private repCount = 0;
  private lastRepTime = 0;
  private angleHistory: Record<string, number>[] = [];

  private currentIssues: JointFeedback[] = [];
  private scoreAccumulator: number[] = [];
  /** Per-frame trust weights matching scoreAccumulator entries 1:1. */
  private trustAccumulator: number[] = [];

  /** Stabilizes per-frame raw issues into "confirmed across N frames" issues. */
  private feedbackAggregator = new FeedbackAggregator();
  /** Same idea for coaching cue strings. */
  private cueStabilizer = new CueStabilizer();

  private cycleState: CycleState = "idle";
  private peakAngle = 0;
  private valleyAngle = 0;
  private depthFrames = 0;
  private isInverted = false;

  private prevPhase = "";
  private stablePhase = "";
  private phaseCounter = 0;
  private inRep = false;
  private reachedDeepPhase = false;
  private deepFrameCount = 0;

  /** Required pose family for this exercise (e.g. pushup → "floor_plank"). */
  private requiredFamily: PoseFamily | null = null;
  /** Consecutive frames the user has been in the "wrong" pose family. */
  private familyDriftFrames = 0;
  /** True once the family-drift guard has tripped this set. */
  private familyMismatch = false;

  constructor(config: ExerciseConfig) {
    this.config = config;
    if (config.repCycle) {
      this.isInverted = config.repCycle.startThreshold < config.repCycle.depthThreshold;
    }
    this.requiredFamily = REQUIRED_FAMILY[config.id] ?? null;
  }

  reset() {
    this.repCount = 0;
    this.lastRepTime = 0;
    this.angleHistory = [];
    this.currentIssues = [];
    this.scoreAccumulator = [];
    this.trustAccumulator = [];
    this.feedbackAggregator.reset();
    this.cueStabilizer.reset();
    this.cycleState = "idle";
    this.peakAngle = 0;
    this.valleyAngle = 0;
    this.depthFrames = 0;
    this.prevPhase = "";
    this.stablePhase = "";
    this.phaseCounter = 0;
    this.inRep = false;
    this.reachedDeepPhase = false;
    this.deepFrameCount = 0;
    this.familyDriftFrames = 0;
    this.familyMismatch = false;
  }

  private smoothAngles(angles: Record<string, number>): Record<string, number> {
    this.angleHistory.push(angles);
    if (this.angleHistory.length > ANGLE_SMOOTHING_WINDOW) this.angleHistory.shift();
    if (this.angleHistory.length < 2) return angles;

    const smoothed: Record<string, number> = {};
    for (const key of Object.keys(angles)) {
      const values = this.angleHistory.map((a) => a[key]);
      smoothed[key] = values.reduce((a, b) => a + b, 0) / values.length;
    }
    return smoothed;
  }

  private getPrimaryAngle(angles: Record<string, number>, cycle: RepCycleConfig): number {
    const values = cycle.primaryAngles.map((k) => angles[k] ?? 0);
    if (values.length === 0) return 0;
    const method = cycle.combineMethod ?? "average";
    if (method === "min") return Math.min(...values);
    if (method === "max") return Math.max(...values);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private isAtStart(angle: number, cycle: RepCycleConfig): boolean {
    return this.isInverted
      ? angle <= cycle.startThreshold
      : angle >= cycle.startThreshold;
  }

  private hasLeftStart(angle: number, cycle: RepCycleConfig): boolean {
    return this.isInverted
      ? angle > cycle.startThreshold + HYSTERESIS_BUFFER
      : angle < cycle.startThreshold - HYSTERESIS_BUFFER;
  }

  private isAtDepth(angle: number, cycle: RepCycleConfig): boolean {
    return this.isInverted
      ? angle >= cycle.depthThreshold
      : angle <= cycle.depthThreshold;
  }

  private hasLeftDepth(angle: number, cycle: RepCycleConfig): boolean {
    return this.isInverted
      ? angle < cycle.depthThreshold - HYSTERESIS_BUFFER
      : angle > cycle.depthThreshold + HYSTERESIS_BUFFER;
  }

  private isBackToStart(angle: number, cycle: RepCycleConfig): boolean {
    const buffer = 10;
    return this.isInverted
      ? angle <= cycle.startThreshold + buffer
      : angle >= cycle.startThreshold - buffer;
  }

  private updateCycleRep(rawAngle: number, smoothedAngle: number, cycle: RepCycleConfig): boolean {
    const angle = smoothedAngle;

    switch (this.cycleState) {
      case "idle": {
        if (this.hasLeftStart(angle, cycle)) {
          this.cycleState = "descending";
          this.peakAngle = this.isInverted
            ? Math.min(this.peakAngle || angle, angle)
            : Math.max(this.peakAngle || angle, angle);
          this.currentIssues = [];
          this.scoreAccumulator = [];
          this.trustAccumulator = [];
        } else {
          this.peakAngle = angle;
        }
        return false;
      }

      case "descending": {
        if (this.isInverted) {
          this.peakAngle = Math.min(this.peakAngle, rawAngle);
        } else {
          this.peakAngle = Math.max(this.peakAngle, rawAngle);
        }

        if (this.isAtDepth(rawAngle, cycle) || this.isAtDepth(angle, cycle)) {
          this.cycleState = "at_depth";
          this.valleyAngle = rawAngle;
          this.depthFrames = 1;
        } else if (this.isAtStart(angle, cycle)) {
          this.cycleState = "idle";
        }
        return false;
      }

      case "at_depth": {
        if (this.isInverted) {
          this.valleyAngle = Math.max(this.valleyAngle, rawAngle);
        } else {
          this.valleyAngle = Math.min(this.valleyAngle, rawAngle);
        }
        this.depthFrames++;

        const minFrames = cycle.minDepthFrames ?? 2;
        if (this.depthFrames >= minFrames && this.hasLeftDepth(angle, cycle)) {
          const rom = Math.abs(this.peakAngle - this.valleyAngle);
          if (rom >= cycle.minROM) {
            this.cycleState = "returning";
          } else {
            this.cycleState = "idle";
          }
        }
        return false;
      }

      case "returning": {
        if (this.isBackToStart(angle, cycle)) {
          const now = Date.now();
          const cooldown = cycle.cooldownMs ?? 600;
          if (now - this.lastRepTime > cooldown) {
            this.repCount++;
            this.lastRepTime = now;
            this.cycleState = "idle";
            this.peakAngle = angle;
            this.depthFrames = 0;
            return true;
          }
          this.cycleState = "idle";
        } else if (this.isAtDepth(angle, cycle)) {
          this.cycleState = "at_depth";
          this.depthFrames = 1;
        }
        return false;
      }

      default:
        return false;
    }
  }

  private getDeepPhase(): string {
    const phases = this.config.phases;
    if (phases.length <= 2) return phases[phases.length - 1];
    return phases[Math.min(phases.length - 1, 2)];
  }

  private getStablePhase(rawPhase: string): string {
    if (rawPhase === this.prevPhase) {
      this.phaseCounter++;
    } else {
      this.phaseCounter = 1;
    }
    this.prevPhase = rawPhase;
    if (this.phaseCounter >= PHASE_STABILITY_FRAMES) this.stablePhase = rawPhase;
    return this.stablePhase;
  }

  private updatePhaseRep(rawPhase: string, phase: string, score: number): boolean {
    if (this.config.id === "plank") return false;
    const phases = this.config.phases;
    if (phases.length < 2 || phase === "") return false;

    const startPhase = phases[0];
    const midPhases = phases.slice(1);
    const deepPhase = this.getDeepPhase();

    if (!this.inRep && (midPhases.includes(phase) || midPhases.includes(rawPhase))) {
      this.inRep = true;
      this.reachedDeepPhase = false;
      this.deepFrameCount = 0;
      this.currentIssues = [];
      this.scoreAccumulator = [score];
      this.trustAccumulator = [1];
    }

    if (this.inRep && (rawPhase === deepPhase || phase === deepPhase)) {
      this.deepFrameCount++;
      if (this.deepFrameCount >= 2) this.reachedDeepPhase = true;
    }

    if (this.inRep && phase === startPhase && this.reachedDeepPhase && this.scoreAccumulator.length >= 4) {
      const now = Date.now();
      if (now - this.lastRepTime > PHASE_REP_COOLDOWN_MS) {
        this.repCount++;
        this.lastRepTime = now;
        this.inRep = false;
        this.reachedDeepPhase = false;
        this.deepFrameCount = 0;
        return true;
      }
    }
    return false;
  }

  update(landmarks: Landmark[]): {
    phase: string;
    score: number;
    issues: JointFeedback[];
    cues: string[];
    repCompleted: boolean;
    repResult?: RepResult;
    repCount: number;
    familyMismatch: boolean;
  } {
    const rawAngles = getCommonAngles(landmarks);
    const smoothedAngles = this.smoothAngles(rawAngles);

    const rawPhase = this.config.detectPhase(rawAngles, landmarks);
    const phase = this.getStablePhase(rawPhase);

    const { score, issues: rawIssues } = this.config.scoreRep(smoothedAngles, landmarks, phase);
    const rawCues = this.config.getCoachingCues(smoothedAngles, landmarks, phase);

    // ---- Visibility gating --------------------------------------------
    // Compute how much we should trust this frame's pose readings. Frames
    // where MediaPipe is uncertain about core landmarks shouldn't be able
    // to introduce false-positive issues, drag the rep score down, or
    // surface a coaching cue. We keep the rep-cycle math (which uses
    // smoothed angles) unaffected so reps still count when the user is
    // partially occluded.
    const trust = frameTrust(landmarks, CORE_LANDMARKS);
    const frameAccepted = trust >= MIN_FRAME_TRUST;

    // Stabilize: an issue/cue must appear in 3-of-last-6 frames before we
    // surface it. This removes the single-frame flicker that was causing
    // "knee caving" / "hips sagging" style false alarms.
    const stableIssues = this.feedbackAggregator.push(rawIssues, frameAccepted);
    const stableCues = this.cueStabilizer.push(rawCues, frameAccepted);

    this.currentIssues = [...this.currentIssues, ...rawIssues];
    this.scoreAccumulator.push(score);
    this.trustAccumulator.push(frameAccepted ? trust : 0);

    // ---- Family-drift guard --------------------------------------------
    // If the user has clearly left this exercise's pose family for several
    // frames in a row (e.g. they were doing push-ups and stood up to walk
    // away) we drop in-flight cycle state so a noisy joint angle on the way
    // back can't trigger a phantom rep. Burpees toggle families inside a
    // single rep, so we use a long grace window before tripping.
    let familyMismatch = false;
    if (this.requiredFamily) {
      const fam = classifyPoseFamily(landmarks);
      const wrong =
        fam.family !== "unknown" &&
        fam.family !== this.requiredFamily &&
        // Burpees legitimately pass through "floor_plank" mid-rep — only
        // flag standing→seated/plank drift, never the in-rep transition.
        !(this.config.id === "burpee" && fam.family === "floor_plank");
      if (wrong) {
        this.familyDriftFrames++;
        if (this.familyDriftFrames >= FAMILY_DRIFT_FRAMES) {
          familyMismatch = true;
          this.familyMismatch = true;
          this.cycleState = "idle";
          this.inRep = false;
          this.reachedDeepPhase = false;
          this.deepFrameCount = 0;
        }
      } else {
        this.familyDriftFrames = 0;
        this.familyMismatch = false;
      }
    }

    let repCompleted = false;

    if (!familyMismatch) {
      const cycle = this.config.repCycle;
      if (cycle) {
        const rawPrimary = this.getPrimaryAngle(rawAngles, cycle);
        const smoothedPrimary = this.getPrimaryAngle(smoothedAngles, cycle);
        repCompleted = this.updateCycleRep(rawPrimary, smoothedPrimary, cycle);
      } else {
        repCompleted = this.updatePhaseRep(rawPhase, phase, score);
      }
    }

    let repResult: RepResult | undefined;
    if (repCompleted) {
      // Visibility-weighted average: a frame the model couldn't read well
      // shouldn't drag a clean rep down. If every frame had zero trust we
      // fall back to a plain mean (better than NaN).
      const totalTrust = this.trustAccumulator.reduce((a, b) => a + b, 0);
      let avgScore: number;
      if (totalTrust > 0.01) {
        let weighted = 0;
        for (let i = 0; i < this.scoreAccumulator.length; i++) {
          weighted += this.scoreAccumulator[i] * (this.trustAccumulator[i] ?? 0);
        }
        avgScore = Math.round(weighted / totalTrust);
      } else {
        avgScore = this.scoreAccumulator.length > 0
          ? Math.round(this.scoreAccumulator.reduce((a, b) => a + b, 0) / this.scoreAccumulator.length)
          : score;
      }

      // Use the aggregator's confirmed issues for the rep summary instead
      // of every per-frame raw issue — this is what the user actually sees
      // in the rep card, and we want it to match what was on screen.
      const repIssues = this.feedbackAggregator.snapshot();
      // Roll the windows over so we don't carry stale state into the next rep.
      this.feedbackAggregator.reset();
      this.cueStabilizer.reset();

      repResult = {
        score: avgScore,
        issues: this.deduplicateIssues(repIssues.length > 0 ? repIssues : this.currentIssues),
        timestamp: Date.now(),
      };
      this.currentIssues = [];
      this.scoreAccumulator = [];
      this.trustAccumulator = [];
    }

    return {
      phase,
      score,
      issues: stableIssues,
      cues: stableCues,
      repCompleted,
      repResult,
      repCount: this.repCount,
      familyMismatch: this.familyMismatch,
    };
  }

  private deduplicateIssues(issues: JointFeedback[]): JointFeedback[] {
    const seen = new Map<string, JointFeedback>();
    for (const issue of issues) {
      const key = `${issue.joint}-${issue.message}`;
      if (!seen.has(key) || issue.status === "poor") seen.set(key, issue);
    }
    return Array.from(seen.values());
  }

  getRepCount(): number {
    return this.repCount;
  }
}
