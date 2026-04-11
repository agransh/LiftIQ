import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const situpConfig: ExerciseConfig = {
  id: "situp",
  name: "Sit-Up",
  description: "Lie on your back, curl your torso up toward your knees.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE],
  phases: ["down", "rising", "up", "lowering"],
  caloriesPerRep: 0.3,
  detectPhase(angles: Record<string, number>): string {
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (avgHip > 150) return "down";
    if (avgHip < 90) return "up";
    return "rising";
  },
  scoreRep(angles: Record<string, number>, _landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (phase === "up" && avgHip > 100) {
      score -= 20;
      issues.push({ joint: "torso", status: "moderate", message: "Come up higher" });
    }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(angles: Record<string, number>): string[] {
    const cues: string[] = [];
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (avgHip > 100) cues.push("Curl up more");
    else cues.push("Good crunch!");
    return cues;
  },
};
