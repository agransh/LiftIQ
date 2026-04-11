import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const lungeConfig: ExerciseConfig = {
  id: "lunge",
  name: "Lunge",
  description: "Step forward with one leg, lowering until both knees are bent at about 90 degrees.",
  targetJoints: [L.LEFT_HIP, L.RIGHT_HIP, L.LEFT_KNEE, L.RIGHT_KNEE, L.LEFT_ANKLE, L.RIGHT_ANKLE],
  phases: ["standing", "stepping", "bottom"],
  caloriesPerRep: 0.4,

  repCycle: {
    primaryAngles: ["leftKnee", "rightKnee"],
    startThreshold: 150,
    depthThreshold: 115,
    minROM: 30,
    minDepthFrames: 2,
    cooldownMs: 700,
    combineMethod: "min",
  },

  detectPhase(angles: Record<string, number>): string {
    const minKnee = Math.min(angles.leftKnee, angles.rightKnee);
    const maxKnee = Math.max(angles.leftKnee, angles.rightKnee);

    if (minKnee > 155 && maxKnee > 155) return "standing";
    if (minKnee < 110) return "bottom";
    return "stepping";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    // Determine which leg is forward
    const leftKneeForward = landmarks[L.LEFT_KNEE].y > landmarks[L.RIGHT_KNEE].y;
    const frontKneeAngle = leftKneeForward ? angles.leftKnee : angles.rightKnee;
    const backKneeAngle = leftKneeForward ? angles.rightKnee : angles.leftKnee;
    const frontKneeIdx = leftKneeForward ? L.LEFT_KNEE : L.RIGHT_KNEE;
    const frontAnkleIdx = leftKneeForward ? L.LEFT_ANKLE : L.RIGHT_ANKLE;

    if (phase === "bottom") {
      // Front knee should be ~90°
      if (frontKneeAngle > 120) {
        score -= Math.min(20, (frontKneeAngle - 90) * 0.5);
        issues.push({ joint: "frontKnee", status: "moderate", message: "Bend front knee more — aim for 90°" });
      }

      // Front knee over ankle
      const kneeX = landmarks[frontKneeIdx].x;
      const ankleX = landmarks[frontAnkleIdx].x;
      if (Math.abs(kneeX - ankleX) > 0.06) {
        score -= 15;
        issues.push({ joint: "frontKnee", status: "poor", message: "Keep front knee stacked over ankle" });
      }

      // Back knee depth
      if (backKneeAngle > 130) {
        score -= Math.min(15, (backKneeAngle - 90) * 0.3);
        issues.push({ joint: "backKnee", status: "moderate", message: "Drop back knee lower" });
      }
    }

    // Torso upright check
    const torsoAngle = calculateAngle(
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_HIP],
      { x: landmarks[L.LEFT_HIP].x, y: landmarks[L.LEFT_HIP].y - 1, z: landmarks[L.LEFT_HIP].z }
    );

    if (torsoAngle > 30) {
      score -= Math.min(20, (torsoAngle - 20) * 0.8);
      issues.push({ joint: "torso", status: torsoAngle > 45 ? "poor" : "moderate", message: "Keep your torso upright" });
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const cues: string[] = [];
    const minKnee = Math.min(angles.leftKnee, angles.rightKnee);

    if (phase === "bottom" && minKnee > 120) {
      cues.push("Go lower");
    }

    const torsoAngle = calculateAngle(
      landmarks[L.LEFT_SHOULDER],
      landmarks[L.LEFT_HIP],
      { x: landmarks[L.LEFT_HIP].x, y: landmarks[L.LEFT_HIP].y - 1, z: landmarks[L.LEFT_HIP].z }
    );
    if (torsoAngle > 30) {
      cues.push("Keep torso upright");
    }

    if (phase === "standing") {
      cues.push("Step forward with control");
    }

    return cues;
  },
};
