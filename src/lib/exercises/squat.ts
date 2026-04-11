import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const squatConfig: ExerciseConfig = {
  id: "squat",
  name: "Squat",
  description: "Stand with feet shoulder-width apart, lower your hips back and down.",
  targetJoints: [L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE, L.LEFT_SHOULDER, L.RIGHT_SHOULDER],
  phases: ["standing", "descending", "bottom", "ascending"],
  caloriesPerRep: 0.4,

  detectPhase(angles: Record<string, number>): string {
    const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    if (avgKnee > 160) return "standing";
    if (avgKnee < 100) return "bottom";
    const avgHip = (angles.leftHip + angles.rightHip) / 2;
    if (avgHip < 120) return "descending";
    return "ascending";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    const avgHip = (angles.leftHip + angles.rightHip) / 2;

    // Depth check — knees should reach ~90° at bottom
    if (phase === "bottom" || phase === "descending") {
      if (avgKnee > 120) {
        const depthPenalty = Math.min(30, (avgKnee - 90) * 0.5);
        score -= depthPenalty;
        issues.push({ joint: "knees", status: avgKnee > 140 ? "poor" : "moderate", message: "Go lower — aim for thighs parallel to ground" });
      }
    }

    // Knee cave check — knees shouldn't go inside ankles
    const leftKneeX = landmarks[L.LEFT_KNEE].x;
    const leftAnkleX = landmarks[L.LEFT_ANKLE].x;
    const rightKneeX = landmarks[L.RIGHT_KNEE].x;
    const rightAnkleX = landmarks[L.RIGHT_ANKLE].x;

    if (leftKneeX > leftAnkleX + 0.03) {
      score -= 15;
      issues.push({ joint: "leftKnee", status: "poor", message: "Left knee is caving inward" });
    }
    if (rightKneeX < rightAnkleX - 0.03) {
      score -= 15;
      issues.push({ joint: "rightKnee", status: "poor", message: "Right knee is caving inward" });
    }

    // Torso angle — lean forward penalty
    const torsoAngle = calculateAngle(
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_HIP],
      { x: landmarks[L.LEFT_HIP].x, y: landmarks[L.LEFT_HIP].y - 1, z: landmarks[L.LEFT_HIP].z }
    );

    if (torsoAngle > 45) {
      score -= Math.min(20, (torsoAngle - 45) * 1);
      issues.push({ joint: "torso", status: torsoAngle > 60 ? "poor" : "moderate", message: "Keep your chest up" });
    }

    // Knee symmetry
    const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
    if (kneeDiff > 15) {
      score -= Math.min(10, kneeDiff * 0.5);
      issues.push({ joint: "knees", status: "moderate", message: "Keep weight balanced on both legs" });
    }

    // Hip hinge
    if (avgHip < 70 && phase === "bottom") {
      score -= 10;
      issues.push({ joint: "hips", status: "moderate", message: "Hinge at the hips, don't fold forward" });
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const cues: string[] = [];
    const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;

    if (phase === "bottom" && avgKnee > 120) {
      cues.push("Go lower");
    }

    const torsoAngle = calculateAngle(
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_HIP],
      { x: landmarks[L.LEFT_HIP].x, y: landmarks[L.LEFT_HIP].y - 1, z: landmarks[L.LEFT_HIP].z }
    );
    if (torsoAngle > 45) {
      cues.push("Keep your back straight");
    }

    const leftKneeX = landmarks[L.LEFT_KNEE].x;
    const leftAnkleX = landmarks[L.LEFT_ANKLE].x;
    const rightKneeX = landmarks[L.RIGHT_KNEE].x;
    const rightAnkleX = landmarks[L.RIGHT_ANKLE].x;

    if (leftKneeX > leftAnkleX + 0.03 || rightKneeX < rightAnkleX - 0.03) {
      cues.push("Don't let knees cave in");
    }

    if (phase === "standing" && avgKnee > 170) {
      cues.push("Good lockout!");
    }

    return cues;
  },
};
