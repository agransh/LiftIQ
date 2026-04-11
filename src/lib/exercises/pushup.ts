import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const pushupConfig: ExerciseConfig = {
  id: "pushup",
  name: "Push-Up",
  description: "Start in a plank, lower chest to the ground, push back up.",
  targetJoints: [L.LEFT_SHOULDER, L.RIGHT_SHOULDER, L.LEFT_ELBOW, L.RIGHT_ELBOW, L.LEFT_WRIST, L.RIGHT_WRIST, L.LEFT_HIP, L.RIGHT_HIP],
  phases: ["top", "descending", "bottom"],
  caloriesPerRep: 0.5,

  detectPhase(angles: Record<string, number>): string {
    const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
    if (avgElbow > 155) return "top";
    if (avgElbow < 90) return "bottom";
    return "descending";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;

    // Depth check
    if (phase === "bottom" && avgElbow > 110) {
      const penalty = Math.min(25, (avgElbow - 90) * 0.8);
      score -= penalty;
      issues.push({ joint: "elbows", status: avgElbow > 130 ? "poor" : "moderate", message: "Lower your chest more" });
    }

    // Body alignment — hip sag or pike
    const bodyAngle = calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_ANKLE]);
    if (bodyAngle < 160) {
      const deviation = 180 - bodyAngle;
      if (landmarks[L.LEFT_HIP].y > landmarks[L.LEFT_SHOULDER].y + 0.05) {
        score -= Math.min(25, deviation * 0.8);
        issues.push({ joint: "hips", status: deviation > 25 ? "poor" : "moderate", message: "Hips are sagging — keep body straight" });
      } else {
        score -= Math.min(20, deviation * 0.6);
        issues.push({ joint: "hips", status: "moderate", message: "Hips are too high — lower them" });
      }
    }

    // Elbow flare
    const elbowFlareLeft = calculateAngle(landmarks[L.LEFT_WRIST], landmarks[L.LEFT_ELBOW], landmarks[L.LEFT_HIP]);
    const elbowFlareRight = calculateAngle(landmarks[L.RIGHT_WRIST], landmarks[L.RIGHT_ELBOW], landmarks[L.RIGHT_HIP]);
    const avgFlare = (elbowFlareLeft + elbowFlareRight) / 2;

    if (avgFlare > 100) {
      score -= Math.min(20, (avgFlare - 80) * 0.5);
      issues.push({ joint: "elbows", status: avgFlare > 120 ? "poor" : "moderate", message: "Keep elbows tucked, don't flare out" });
    }

    // Symmetry check
    const elbowDiff = Math.abs(angles.leftElbow - angles.rightElbow);
    if (elbowDiff > 15) {
      score -= Math.min(10, elbowDiff * 0.4);
      issues.push({ joint: "elbows", status: "moderate", message: "Keep arms even" });
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const cues: string[] = [];
    const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;

    if (phase === "bottom" && avgElbow > 110) {
      cues.push("Lower your chest more");
    }

    const bodyAngle = calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_ANKLE]);
    if (bodyAngle < 160) {
      cues.push("Keep body straight");
    }

    if (phase === "top" && avgElbow > 165) {
      cues.push("Good lockout!");
    }

    return cues;
  },
};
