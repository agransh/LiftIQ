import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted, bestSide, vis, STRICT_TRUST_VIS } from "@/lib/pose/landmark-quality";

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

  repCycle: {
    primaryAngles: ["leftKnee", "rightKnee"],
    startThreshold: 155,
    depthThreshold: 115,
    minROM: 35,
    minDepthFrames: 2,
    cooldownMs: 600,
  },

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

    const leftLegOk = allTrusted(landmarks, [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE]);
    const rightLegOk = allTrusted(landmarks, [L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE]);

    let avgKnee = NaN;
    if (leftLegOk && rightLegOk) avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    else if (leftLegOk) avgKnee = angles.leftKnee;
    else if (rightLegOk) avgKnee = angles.rightKnee;

    let avgHip = NaN;
    if (leftLegOk && rightLegOk) avgHip = (angles.leftHip + angles.rightHip) / 2;
    else if (leftLegOk) avgHip = angles.leftHip;
    else if (rightLegOk) avgHip = angles.rightHip;

    // Depth check — knees should reach ~90° at bottom
    if (isFinite(avgKnee) && (phase === "bottom" || phase === "descending")) {
      if (avgKnee > 120) {
        const depthPenalty = Math.min(30, (avgKnee - 90) * 0.5);
        score -= depthPenalty;
        issues.push({ joint: "knees", status: avgKnee > 140 ? "poor" : "moderate", message: "Go lower — aim for thighs parallel to ground" });
      }
    }

    // Knee cave check — only when the matching ankle+knee are clearly visible.
    // This is an x-position comparison so a missing ankle gives nonsense.
    if (vis(landmarks, L.LEFT_KNEE) >= STRICT_TRUST_VIS && vis(landmarks, L.LEFT_ANKLE) >= STRICT_TRUST_VIS) {
      if (landmarks[L.LEFT_KNEE].x > landmarks[L.LEFT_ANKLE].x + 0.03) {
        score -= 15;
        issues.push({ joint: "leftKnee", status: "poor", message: "Left knee is caving inward" });
      }
    }
    if (vis(landmarks, L.RIGHT_KNEE) >= STRICT_TRUST_VIS && vis(landmarks, L.RIGHT_ANKLE) >= STRICT_TRUST_VIS) {
      if (landmarks[L.RIGHT_KNEE].x < landmarks[L.RIGHT_ANKLE].x - 0.03) {
        score -= 15;
        issues.push({ joint: "rightKnee", status: "poor", message: "Right knee is caving inward" });
      }
    }

    // Torso angle — pick whichever shoulder/hip pair is reliable.
    const torsoSide = bestSide(landmarks, [L.LEFT_SHOULDER, L.LEFT_HIP], [L.RIGHT_SHOULDER, L.RIGHT_HIP]);
    if (torsoSide) {
      const [shoulderIdx, hipIdx] = torsoSide;
      const torsoAngle = calculateAngle(
        landmarks[shoulderIdx],
        landmarks[hipIdx],
        { x: landmarks[hipIdx].x, y: landmarks[hipIdx].y - 1, z: landmarks[hipIdx].z },
      );
      if (torsoAngle > 45) {
        score -= Math.min(20, (torsoAngle - 45) * 1);
        issues.push({ joint: "torso", status: torsoAngle > 60 ? "poor" : "moderate", message: "Keep your chest up" });
      }
    }

    // Knee symmetry — only meaningful when BOTH legs are reliable.
    if (leftLegOk && rightLegOk) {
      const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
      if (kneeDiff > 15) {
        score -= Math.min(10, kneeDiff * 0.5);
        issues.push({ joint: "knees", status: "moderate", message: "Keep weight balanced on both legs" });
      }
    }

    if (isFinite(avgHip) && avgHip < 70 && phase === "bottom") {
      score -= 10;
      issues.push({ joint: "hips", status: "moderate", message: "Hinge at the hips, don't fold forward" });
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const cues: string[] = [];

    const leftLegOk = allTrusted(landmarks, [L.LEFT_HIP, L.LEFT_KNEE, L.LEFT_ANKLE]);
    const rightLegOk = allTrusted(landmarks, [L.RIGHT_HIP, L.RIGHT_KNEE, L.RIGHT_ANKLE]);
    let avgKnee = NaN;
    if (leftLegOk && rightLegOk) avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    else if (leftLegOk) avgKnee = angles.leftKnee;
    else if (rightLegOk) avgKnee = angles.rightKnee;

    if (isFinite(avgKnee) && phase === "bottom" && avgKnee > 120) {
      cues.push("Go lower");
    }

    const torsoSide = bestSide(landmarks, [L.LEFT_SHOULDER, L.LEFT_HIP], [L.RIGHT_SHOULDER, L.RIGHT_HIP]);
    if (torsoSide) {
      const [shoulderIdx, hipIdx] = torsoSide;
      const torsoAngle = calculateAngle(
        landmarks[shoulderIdx],
        landmarks[hipIdx],
        { x: landmarks[hipIdx].x, y: landmarks[hipIdx].y - 1, z: landmarks[hipIdx].z },
      );
      if (torsoAngle > 45) {
        cues.push("Keep your back straight");
      }
    }

    const leftCave = vis(landmarks, L.LEFT_KNEE) >= STRICT_TRUST_VIS && vis(landmarks, L.LEFT_ANKLE) >= STRICT_TRUST_VIS
      && landmarks[L.LEFT_KNEE].x > landmarks[L.LEFT_ANKLE].x + 0.03;
    const rightCave = vis(landmarks, L.RIGHT_KNEE) >= STRICT_TRUST_VIS && vis(landmarks, L.RIGHT_ANKLE) >= STRICT_TRUST_VIS
      && landmarks[L.RIGHT_KNEE].x < landmarks[L.RIGHT_ANKLE].x - 0.03;
    if (leftCave || rightCave) {
      cues.push("Don't let knees cave in");
    }

    if (isFinite(avgKnee) && phase === "standing" && avgKnee > 170) {
      cues.push("Good lockout!");
    }

    return cues;
  },
};
