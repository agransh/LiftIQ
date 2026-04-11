import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const mountainClimberConfig: ExerciseConfig = {
  id: "mountain-climber",
  name: "Mountain Climber",
  description: "Start in plank and alternate driving knees toward chest.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE],
  phases: ["neutral", "left-drive", "right-drive"],
  caloriesPerRep: 0.3,
  detectPhase(angles: Record<string, number>): string {
    if (angles.leftHip < 100) return "left-drive";
    if (angles.rightHip < 100) return "right-drive";
    return "neutral";
  },
  scoreRep(angles: Record<string, number>, landmarks: Landmark[]) {
    const issues: JointFeedback[] = [];
    let score = 100;
    const bodyAngle = calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_ANKLE]);
    if (bodyAngle < 150) { score -= 20; issues.push({ joint: "hips", status: "moderate", message: "Keep hips level" }); }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(): string[] { return ["Drive knees to chest", "Keep hips level"]; },
};
