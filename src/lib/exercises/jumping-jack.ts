import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const jumpingJackConfig: ExerciseConfig = {
  id: "jumping-jack",
  name: "Jumping Jack",
  description: "Jump while spreading legs and raising arms overhead, then return.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_WRIST, L.RIGHT_WRIST, L.LEFT_ANKLE, L.RIGHT_ANKLE],
  phases: ["closed", "open"],
  caloriesPerRep: 0.2,

  repCycle: {
    primaryAngles: ["leftShoulder", "rightShoulder"],
    startThreshold: 60,
    depthThreshold: 140,
    minROM: 50,
    minDepthFrames: 1,
    cooldownMs: 300,
  },

  detectPhase(angles: Record<string, number>): string {
    const avgShoulder = (angles.leftShoulder + angles.rightShoulder) / 2;
    return avgShoulder > 140 ? "open" : "closed";
  },
  scoreRep(angles: Record<string, number>, _landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;
    if (phase === "open") {
      const avgShoulder = (angles.leftShoulder + angles.rightShoulder) / 2;
      if (avgShoulder < 160) { score -= 15; issues.push({ joint: "arms", status: "moderate", message: "Raise arms higher" }); }
    }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(angles: Record<string, number>): string[] {
    const avgShoulder = (angles.leftShoulder + angles.rightShoulder) / 2;
    return avgShoulder < 160 ? ["Arms higher!"] : ["Good rhythm!"];
  },
};
