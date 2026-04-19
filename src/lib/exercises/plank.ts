import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { bestSide } from "@/lib/pose/landmark-quality";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function bodyLineAngle(landmarks: Landmark[]): { angle: number; shoulderY: number; hipY: number } | null {
  const side = bestSide(
    landmarks,
    [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE],
    [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_ANKLE],
  );
  if (!side) return null;
  const [shoulderIdx, hipIdx, ankleIdx] = side;
  return {
    angle: calculateAngle(landmarks[shoulderIdx], landmarks[hipIdx], landmarks[ankleIdx]),
    shoulderY: landmarks[shoulderIdx].y,
    hipY: landmarks[hipIdx].y,
  };
}

export const plankConfig: ExerciseConfig = {
  id: "plank",
  name: "Plank",
  description: "Hold a straight-body position on forearms and toes.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_ANKLE, L.RIGHT_ANKLE],
  phases: ["holding"],
  caloriesPerRep: 0.15, // per second
  detectPhase(): string { return "holding"; },
  scoreRep(angles: Record<string, number>, landmarks: Landmark[]) {
    const issues: JointFeedback[] = [];
    let score = 100;
    const result = bodyLineAngle(landmarks);
    if (!result) return { score: clampScore(score), issues };
    const { angle: bodyAngle, shoulderY, hipY } = result;
    if (bodyAngle < 155) {
      const dev = 180 - bodyAngle;
      score -= Math.min(40, dev * 1.2);
      if (hipY > shoulderY) {
        issues.push({ joint: "hips", status: dev > 20 ? "poor" : "moderate", message: "Hips are sagging — engage your core" });
      } else {
        issues.push({ joint: "hips", status: "moderate", message: "Hips are too high — lower them" });
      }
    }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(_angles: Record<string, number>, landmarks: Landmark[]): string[] {
    const cues: string[] = [];
    const result = bodyLineAngle(landmarks);
    if (!result) return cues;
    if (result.angle < 155) cues.push("Engage your core");
    else cues.push("Great form — hold it!");
    return cues;
  },
};
