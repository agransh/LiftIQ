import { ExerciseConfig, Landmark, JointFeedback } from "@/types";
import { POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import { allTrusted, vis, STRICT_TRUST_VIS } from "@/lib/pose/landmark-quality";

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

  repCycle: {
    primaryAngles: ["leftElbow", "rightElbow"],
    startThreshold: 140,
    depthThreshold: 70,
    minROM: 50,
    minDepthFrames: 2,
    cooldownMs: 500,
  },

  detectPhase(angles: Record<string, number>): string {
    const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
    if (avgElbow > 150) return "extended";
    if (avgElbow < 60) return "contracted";
    return "curling";
  },
  scoreRep(angles: Record<string, number>, landmarks: Landmark[], phase: string) {
    const issues: JointFeedback[] = [];
    let score = 100;

    const leftArmOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST]);
    const rightArmOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST]);

    if (phase === "contracted") {
      let avg = NaN;
      if (leftArmOk && rightArmOk) avg = (angles.leftElbow + angles.rightElbow) / 2;
      else if (leftArmOk) avg = angles.leftElbow;
      else if (rightArmOk) avg = angles.rightElbow;
      if (isFinite(avg) && avg > 70) {
        score -= 15;
        issues.push({ joint: "elbows", status: "moderate", message: "Curl higher" });
      }
    }

    // Elbow drift — only flag a side whose shoulder+elbow we trust enough.
    const leftDriftOk = vis(landmarks, L.LEFT_SHOULDER) >= STRICT_TRUST_VIS && vis(landmarks, L.LEFT_ELBOW) >= STRICT_TRUST_VIS;
    const rightDriftOk = vis(landmarks, L.RIGHT_SHOULDER) >= STRICT_TRUST_VIS && vis(landmarks, L.RIGHT_ELBOW) >= STRICT_TRUST_VIS;
    const leftDrift = leftDriftOk ? Math.abs(landmarks[L.LEFT_ELBOW].x - landmarks[L.LEFT_SHOULDER].x) : 0;
    const rightDrift = rightDriftOk ? Math.abs(landmarks[L.RIGHT_ELBOW].x - landmarks[L.RIGHT_SHOULDER].x) : 0;
    if ((leftDriftOk && leftDrift > 0.08) || (rightDriftOk && rightDrift > 0.08)) {
      score -= 15;
      issues.push({ joint: "elbows", status: "moderate", message: "Keep elbows tucked at your sides" });
    }
    return { score: clampScore(score), issues };
  },
  getCoachingCues(angles: Record<string, number>, landmarks: Landmark[]): string[] {
    const leftArmOk = allTrusted(landmarks, [L.LEFT_SHOULDER, L.LEFT_ELBOW, L.LEFT_WRIST]);
    const rightArmOk = allTrusted(landmarks, [L.RIGHT_SHOULDER, L.RIGHT_ELBOW, L.RIGHT_WRIST]);
    let avg = NaN;
    if (leftArmOk && rightArmOk) avg = (angles.leftElbow + angles.rightElbow) / 2;
    else if (leftArmOk) avg = angles.leftElbow;
    else if (rightArmOk) avg = angles.rightElbow;

    if (!isFinite(avg)) return [];
    if (avg > 70) return ["Curl higher", "Keep elbows tucked"];
    return ["Slow and controlled"];
  },
};
