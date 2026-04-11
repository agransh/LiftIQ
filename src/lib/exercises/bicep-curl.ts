import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const bicepCurlConfig: ExerciseConfig = {
  id: "bicep-curl",
  name: "Bicep Curl",
  description: "Curl weight from extended arm to shoulder, keeping elbows stationary.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
  phases: ["extended", "curling", "contracted"],
  caloriesPerRep: 0.2,
  detectPhase(angles: Record<string, number>): string {
    const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
    if (avgElbow > 150) return "extended";
    if (avgElbow < 60) return "contracted";
    return "curling";
  },
  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;
    if (phase === "contracted") {
      const avg = (angles.leftElbow + angles.rightElbow) / 2;
      if (avg > 70) { score -= 15; issues.push({ joint: "elbows", status: "moderate", message: "Curl higher" }); }
    }
    // Elbow drift — shoulders shouldn't move much
    const shoulderDrift = Math.abs(landmarks[L.LEFT_ELBOW].x - landmarks[L.LEFT_SHOULDER].x);
    if (shoulderDrift > 0.08) {
      score -= 15;
      issues.push({ joint: "elbows", status: "moderate", message: "Keep elbows tucked at your sides" });
    }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(angles: Record<string, number>): string[] {
    const avg = (angles.leftElbow + angles.rightElbow) / 2;
    if (avg > 70) return ["Curl higher", "Keep elbows tucked"];
    return ["Slow and controlled"];
  },
};
