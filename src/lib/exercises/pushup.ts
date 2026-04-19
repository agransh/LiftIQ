import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { calculateAngle, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted, bestSide, safeAngle, vis, TRUST_VIS } from "@/lib/pose/landmark-quality";

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

  repCycle: {
    primaryAngles: ["leftElbow", "rightElbow"],
    startThreshold: 150,
    depthThreshold: 100,
    minROM: 40,
    minDepthFrames: 2,
    cooldownMs: 280,
  },

  detectPhase(angles: Record<string, number>): string {
    const left = angles.leftElbow;
    const right = angles.rightElbow;
    const avgElbow = (left + right) / 2;
    const minElbow = Math.min(left, right);

    // Top (lockout): relaxed — many athletes stay ~145–165°; strict 155° missed reps.
    if (avgElbow >= 146) return "top";

    // Bottom (chest low): use deepest elbow + avg — strict <90° rarely held 2+ stable frames on webcam.
    if (minElbow < 118 || avgElbow < 122) return "bottom";

    return "descending";
  },

  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const leftElbowOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST]);
    const rightElbowOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST]);

    // Depth check — only judge if at least one elbow chain is reliable.
    let avgElbow = NaN;
    if (leftElbowOk && rightElbowOk) avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
    else if (leftElbowOk) avgElbow = angles.leftElbow;
    else if (rightElbowOk) avgElbow = angles.rightElbow;

    if (isFinite(avgElbow) && phase === "bottom" && avgElbow > 125) {
      const penalty = Math.min(25, (avgElbow - 118) * 0.8);
      score -= penalty;
      issues.push({ joint: "elbows", status: avgElbow > 135 ? "poor" : "moderate", message: "Lower your chest more" });
    }

    // Body alignment — pick whichever side has clean shoulder/hip/ankle so a
    // partially-occluded torso doesn't trigger a false "hips sagging" alert.
    const side = bestSide(
      landmarks,
      [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE],
      [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_ANKLE],
    );
    if (side) {
      const [shoulderIdx, hipIdx, ankleIdx] = side;
      const bodyAngle = calculateAngle(landmarks[shoulderIdx], landmarks[hipIdx], landmarks[ankleIdx]);
      if (bodyAngle < 160) {
        const deviation = 180 - bodyAngle;
        if (landmarks[hipIdx].y > landmarks[shoulderIdx].y + 0.05) {
          score -= Math.min(25, deviation * 0.8);
          issues.push({ joint: "hips", status: deviation > 25 ? "poor" : "moderate", message: "Hips are sagging — keep body straight" });
        } else {
          score -= Math.min(20, deviation * 0.6);
          issues.push({ joint: "hips", status: "moderate", message: "Hips are too high — lower them" });
        }
      }
    }

    // Elbow flare — score only the sides we trust, average if we have both.
    let avgFlare = NaN;
    const leftFlare = leftElbowOk && vis(landmarks, L.LEFT_HIP) >= TRUST_VIS
      ? calculateAngle(landmarks[L.LEFT_WRIST], landmarks[L.LEFT_ELBOW], landmarks[L.LEFT_HIP])
      : NaN;
    const rightFlare = rightElbowOk && vis(landmarks, L.RIGHT_HIP) >= TRUST_VIS
      ? calculateAngle(landmarks[L.RIGHT_WRIST], landmarks[L.RIGHT_ELBOW], landmarks[L.RIGHT_HIP])
      : NaN;
    if (isFinite(leftFlare) && isFinite(rightFlare)) avgFlare = (leftFlare + rightFlare) / 2;
    else if (isFinite(leftFlare)) avgFlare = leftFlare;
    else if (isFinite(rightFlare)) avgFlare = rightFlare;

    if (isFinite(avgFlare) && avgFlare > 100) {
      score -= Math.min(20, (avgFlare - 80) * 0.5);
      issues.push({ joint: "elbows", status: avgFlare > 120 ? "poor" : "moderate", message: "Keep elbows tucked, don't flare out" });
    }

    // Symmetry check — only meaningful when BOTH sides are reliable.
    if (leftElbowOk && rightElbowOk) {
      const elbowDiff = Math.abs(angles.leftElbow - angles.rightElbow);
      if (elbowDiff > 15) {
        score -= Math.min(10, elbowDiff * 0.4);
        issues.push({ joint: "elbows", status: "moderate", message: "Keep arms even" });
      }
    }

    return { score: clampScore(score), issues };
  },

  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[], phase: string): string[] {
    const cues: string[] = [];

    const leftElbowOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST]);
    const rightElbowOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST]);
    let avgElbow = NaN;
    if (leftElbowOk && rightElbowOk) avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
    else if (leftElbowOk) avgElbow = angles.leftElbow;
    else if (rightElbowOk) avgElbow = angles.rightElbow;

    if (isFinite(avgElbow) && phase === "bottom" && avgElbow > 125) {
      cues.push("Lower your chest more");
    }

    const side = bestSide(
      landmarks,
      [L.LEFT_SHOULDER, L.LEFT_HIP, L.LEFT_ANKLE],
      [L.RIGHT_SHOULDER, L.RIGHT_HIP, L.RIGHT_ANKLE],
    );
    if (side) {
      const bodyAngle = safeAngle(landmarks, side[0], side[1], side[2]);
      if (isFinite(bodyAngle) && bodyAngle < 160) {
        cues.push("Keep body straight");
      }
    }

    if (isFinite(avgElbow) && phase === "top" && avgElbow > 150) {
      cues.push("Good lockout!");
    }

    return cues;
  },
};
