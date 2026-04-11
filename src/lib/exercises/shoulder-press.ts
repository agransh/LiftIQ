import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const shoulderPressConfig: ExerciseConfig = {
  id: "shoulder-press",
  name: "Shoulder Press",
  description: "Press weight from shoulder height straight overhead.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST],
  phases: ["bottom", "pressing", "top"],
  caloriesPerRep: 0.4,
  detectPhase(angles: Record<string, number>): string {
    const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
    if (avgElbow > 160) return "top";
    if (avgElbow < 100) return "bottom";
    return "pressing";
  },
  scoreRep(angles: Record<string, number>, _landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;
    if (phase === "top") {
      const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
      if (avgElbow < 165) { score -= 15; issues.push({ joint: "elbows", status: "moderate", message: "Extend arms fully at the top" }); }
    }
    const diff = Math.abs(angles.leftElbow - angles.rightElbow);
    if (diff > 20) { score -= 10; issues.push({ joint: "arms", status: "moderate", message: "Keep arms even" }); }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(angles: Record<string, number>): string[] {
    const avg = (angles.leftElbow + angles.rightElbow) / 2;
    if (avg < 165) return ["Press all the way up"];
    return ["Good lockout!"];
  },
};
