import { Landmark } from "@/types";
import { calculateAngle } from "./angle-utils";

/**
 * Visibility-aware helpers for pose-based scoring.
 *
 * These exist because MediaPipe will happily report a numeric x/y for a
 * landmark it has zero confidence about — so any downstream "knee is caving"
 * or "hips sagging" check that doesn't first verify the landmarks are
 * trustworthy will fire false positives whenever a body part is occluded,
 * out of frame, or motion-blurred.
 */

/** Landmark visibility threshold below which we treat a joint as untrustworthy. */
export const TRUST_VIS = 0.55;

/** Stricter threshold for safety/symmetry calls where false positives sting. */
export const STRICT_TRUST_VIS = 0.65;

export function vis(landmarks: Landmark[], idx: number): number {
  return landmarks[idx]?.visibility ?? 0;
}

export function allTrusted(
  landmarks: Landmark[],
  indices: number[],
  threshold = TRUST_VIS,
): boolean {
  for (const i of indices) {
    if (vis(landmarks, i) < threshold) return false;
  }
  return true;
}

/**
 * Returns the angle a–b–c only if all three landmarks are trustworthy.
 * Returns NaN otherwise so callers can `if (!isFinite(angle)) return;`
 * and skip the whole check rather than reasoning about a garbage value.
 */
export function safeAngle(
  landmarks: Landmark[],
  a: number,
  b: number,
  c: number,
  threshold = TRUST_VIS,
): number {
  if (!allTrusted(landmarks, [a, b, c], threshold)) return NaN;
  return calculateAngle(landmarks[a], landmarks[b], landmarks[c]);
}

/**
 * For checks that only need ONE side (e.g. body-line angle for plank), pick
 * whichever side has higher confidence. Returns the indices to use, or null
 * if neither side is trustworthy.
 *
 *   const side = bestSide(lms, [LSHO, LHIP, LANK], [RSHO, RHIP, RANK]);
 *   if (!side) return; // skip — neither side reliable
 *   const angle = calculateAngle(lms[side[0]], lms[side[1]], lms[side[2]]);
 */
export function bestSide(
  landmarks: Landmark[],
  leftIndices: number[],
  rightIndices: number[],
  threshold = TRUST_VIS,
): number[] | null {
  const lOk = allTrusted(landmarks, leftIndices, threshold);
  const rOk = allTrusted(landmarks, rightIndices, threshold);
  if (lOk && rOk) {
    // Both sides reliable — pick whichever has higher average visibility so
    // we use the cleaner data.
    const lScore = leftIndices.reduce((s, i) => s + vis(landmarks, i), 0);
    const rScore = rightIndices.reduce((s, i) => s + vis(landmarks, i), 0);
    return lScore >= rScore ? leftIndices : rightIndices;
  }
  if (lOk) return leftIndices;
  if (rOk) return rightIndices;
  return null;
}

/**
 * Average two angles when both are reliable; fall back to whichever is
 * reliable; return NaN when neither is. Useful for "average elbow", "average
 * knee" style checks that should NOT include garbage from an occluded side.
 */
export function bilateralAverage(
  leftAngle: number,
  rightAngle: number,
  leftReliable: boolean,
  rightReliable: boolean,
): number {
  if (leftReliable && rightReliable) return (leftAngle + rightAngle) / 2;
  if (leftReliable) return leftAngle;
  if (rightReliable) return rightAngle;
  return NaN;
}

/**
 * Coarse per-frame "how much should we trust this frame?" score in [0, 1].
 * Used by the rep detector to weight a frame's contribution to the rep's
 * average score. A frame where the model is clearly uncertain about most
 * core landmarks shouldn't drag a clean rep's score down.
 */
export function frameTrust(landmarks: Landmark[], indices: number[]): number {
  if (indices.length === 0) return 0;
  let sum = 0;
  let n = 0;
  for (const i of indices) {
    const v = vis(landmarks, i);
    sum += Math.max(0, Math.min(1, v));
    n++;
  }
  return n === 0 ? 0 : sum / n;
}
