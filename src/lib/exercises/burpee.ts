import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const burpeeConfig: ExerciseConfig = {
  id: "burpee",
  name: "Burpee",
  description: "Squat down, kick back to plank, do a push-up, jump back up.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ELBOW, L.RIGHT_ELBOW],
  phases: ["standing", "squat", "plank", "jumping"],
  caloriesPerRep: 1.0,
  detectPhase(angles: Record<string, number>, landmarks: Landmark[]): string {
    const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    const bodyAngle = calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_ANKLE]);
    if (avgKnee > 160 && bodyAngle > 160) return "standing";
    if (bodyAngle < 140 && avgKnee > 140) return "plank";
    if (avgKnee < 120) return "squat";
    return "jumping";
  },
  scoreRep(angles: Record<string, number>, landmarks: Landmark[]) {
    const issues: JointFeedback[] = [];
    let score = 100;
    const bodyAngle = calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_ANKLE]);
    if (bodyAngle < 150) { score -= 15; issues.push({ joint: "hips", status: "moderate", message: "Keep body straight in plank" }); }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(): string[] { return ["Explosive jump!", "Chest to floor"]; },
};
