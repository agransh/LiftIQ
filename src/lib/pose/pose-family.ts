import { Landmark } from "@/types";
import { POSE_LANDMARKS as L } from "./angle-utils";

/**
 * A pose family is a coarse postural category — "are you on the floor or
 * standing?" — used to gate exercise-specific validators. It intentionally
 * makes no claim about which exercise you're doing.
 */
export type PoseFamily =
  | "standing"
  | "floor_plank"
  | "seated_floor"
  | "kneeling"
  | "unknown";

export interface PoseFamilyResult {
  family: PoseFamily;
  /** 0..1 — confidence in the chosen family. */
  confidence: number;
  /** Diagnostic features the validator can reuse (avoids recomputation). */
  features: PoseFeatures;
}

export interface PoseFeatures {
  /** Average shoulder & hip visibility (0..1); low values mean the gate is unreliable. */
  visibility: number;
  /** Bounding-box aspect (width / height) of the body in normalized coords. */
  aspect: number;
  /** Torso angle from vertical in degrees: 0 = perfectly upright, 90 = horizontal. */
  torsoFromVertical: number;
  /** Vertical span shoulder→ankle in normalized coords. */
  shoulderAnkleY: number;
  /** Hip relative to shoulder: positive = hip lower than shoulder (standing). */
  hipBelowShoulder: number;
  /** Ankle relative to hip: positive = ankle lower than hip (standing). */
  ankleBelowHip: number;
  /** Knee bent (knee angle estimate using hip→knee→ankle), 0..180; lower = more bent. */
  avgKneeAngle: number;
  /** Knee y relative to hip y: positive = knee lower than hip (standing). */
  kneeBelowHip: number;
}

const MIN_FEATURE_VISIBILITY = 0.5;

function vis(lm: Landmark | undefined): number {
  return lm?.visibility ?? 0;
}

function avgPoint(a: Landmark, b: Landmark): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((r * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

export function extractFeatures(landmarks: Landmark[]): PoseFeatures | null {
  if (!landmarks || landmarks.length < 33) return null;

  const ls = landmarks[L.LEFT_SHOULDER];
  const rs = landmarks[L.RIGHT_SHOULDER];
  const lh = landmarks[L.LEFT_HIP];
  const rh = landmarks[L.RIGHT_HIP];
  const lk = landmarks[L.LEFT_KNEE];
  const rk = landmarks[L.RIGHT_KNEE];
  const la = landmarks[L.LEFT_ANKLE];
  const ra = landmarks[L.RIGHT_ANKLE];

  const shoulderVis = (vis(ls) + vis(rs)) / 2;
  const hipVis = (vis(lh) + vis(rh)) / 2;
  if (shoulderVis < MIN_FEATURE_VISIBILITY || hipVis < MIN_FEATURE_VISIBILITY) {
    return null;
  }

  const visibility = (shoulderVis + hipVis + (vis(lk) + vis(rk)) / 2 + (vis(la) + vis(ra)) / 2) / 4;

  const shoulder = avgPoint(ls, rs);
  const hip = avgPoint(lh, rh);
  const knee = avgPoint(lk, rk);
  const ankle = avgPoint(la, ra);

  const allX = [ls.x, rs.x, lh.x, rh.x, lk.x, rk.x, la.x, ra.x];
  const allY = [ls.y, rs.y, lh.y, rh.y, lk.y, rk.y, la.y, ra.y];
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const w = Math.max(1e-3, maxX - minX);
  const h = Math.max(1e-3, maxY - minY);
  const aspect = w / h;

  // Torso from vertical: 0° = vertical (standing), 90° = horizontal (plank)
  const dx = Math.abs(shoulder.x - hip.x);
  const dy = Math.abs(shoulder.y - hip.y);
  const torsoFromVertical = (Math.atan2(dx, Math.max(1e-3, dy)) * 180) / Math.PI;

  // Average knee angle (only if knees + ankles are reasonably visible)
  let avgKneeAngle = 180;
  const lkOk = vis(lh) > 0.4 && vis(lk) > 0.4 && vis(la) > 0.4;
  const rkOk = vis(rh) > 0.4 && vis(rk) > 0.4 && vis(ra) > 0.4;
  if (lkOk && rkOk) avgKneeAngle = (angleAt(lh, lk, la) + angleAt(rh, rk, ra)) / 2;
  else if (lkOk) avgKneeAngle = angleAt(lh, lk, la);
  else if (rkOk) avgKneeAngle = angleAt(rh, rk, ra);

  return {
    visibility,
    aspect,
    torsoFromVertical,
    shoulderAnkleY: ankle.y - shoulder.y,
    hipBelowShoulder: hip.y - shoulder.y,
    ankleBelowHip: ankle.y - hip.y,
    avgKneeAngle,
    kneeBelowHip: knee.y - hip.y,
  };
}

/**
 * Classify the user's coarse pose family. Designed to be conservative — when
 * features disagree, we return "unknown" rather than guessing.
 *
 * Coordinate convention: y grows DOWNWARD (MediaPipe normalized image coords).
 * So "hip below shoulder" means hip.y > shoulder.y.
 */
export function classifyPoseFamily(landmarks: Landmark[]): PoseFamilyResult {
  const features = extractFeatures(landmarks);
  if (!features) {
    return {
      family: "unknown",
      confidence: 0,
      features: {
        visibility: 0,
        aspect: 0,
        torsoFromVertical: 0,
        shoulderAnkleY: 0,
        hipBelowShoulder: 0,
        ankleBelowHip: 0,
        avgKneeAngle: 180,
        kneeBelowHip: 0,
      },
    };
  }

  const f = features;

  // STANDING signature:
  //  - torso roughly vertical (< 30° from vertical)
  //  - hip well below shoulders (> 0.12 normalized)
  //  - ankle well below hip (> 0.12 normalized)
  //  - vertical body bbox (aspect < 0.7)
  //  - legs roughly extended (avg knee > 150°)  — relaxed to allow squat tops
  const standingScore =
    (f.torsoFromVertical < 30 ? 1 : 0) +
    (f.hipBelowShoulder > 0.12 ? 1 : 0) +
    (f.ankleBelowHip > 0.12 ? 1 : 0) +
    (f.aspect < 0.7 ? 1 : 0) +
    (f.avgKneeAngle > 150 ? 1 : 0);

  // FLOOR_PLANK signature:
  //  - torso clearly horizontal (> 55° from vertical)
  //  - shoulder→ankle small in y (< 0.25)
  //  - body bbox wide (aspect > 1.4)
  //  - hip y close to shoulder y (|hipBelowShoulder| < 0.12)
  const plankScore =
    (f.torsoFromVertical > 55 ? 1 : 0) +
    (Math.abs(f.shoulderAnkleY) < 0.25 ? 1 : 0) +
    (f.aspect > 1.4 ? 1 : 0) +
    (Math.abs(f.hipBelowShoulder) < 0.12 ? 1 : 0);

  // SEATED_FLOOR signature:
  //  - torso roughly upright OR mildly leaned (< 45° from vertical)
  //  - knees not below hips much (kneeBelowHip < 0.08) — legs roughly horizontal
  //  - knees bent (< 130°)
  //  - aspect not extreme
  const seatedScore =
    (f.torsoFromVertical < 45 ? 1 : 0) +
    (f.kneeBelowHip < 0.08 ? 1 : 0) +
    (f.avgKneeAngle < 130 ? 1 : 0) +
    (f.aspect < 1.4 ? 1 : 0);

  // KNEELING signature:
  //  - torso vertical
  //  - knees roughly aligned with hips horizontally (small kneeBelowHip)
  //  - ankles below knees (foot tucked back)
  const kneelingScore =
    (f.torsoFromVertical < 30 ? 1 : 0) +
    (Math.abs(f.kneeBelowHip) < 0.06 ? 1 : 0) +
    (f.avgKneeAngle < 110 ? 1 : 0);

  type Choice = { family: PoseFamily; score: number };
  const choices: Choice[] = [
    { family: "standing", score: standingScore / 5 },
    { family: "floor_plank", score: plankScore / 4 },
    { family: "seated_floor", score: seatedScore / 4 },
    { family: "kneeling", score: kneelingScore / 3 },
  ];
  choices.sort((a, b) => b.score - a.score);
  const top = choices[0];
  const second = choices[1];

  // Require a clear winner with a meaningful margin; otherwise "unknown".
  if (top.score < 0.6 || top.score - second.score < 0.15) {
    return { family: "unknown", confidence: top.score, features };
  }

  return {
    family: top.family,
    confidence: Math.min(1, top.score * f.visibility),
    features,
  };
}
