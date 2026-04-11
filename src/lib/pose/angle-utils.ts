import { Landmark } from "@/types";

export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function calculateDistance(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
  );
}

export function calculateDistance2D(a: Landmark, b: Landmark): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function midpoint(a: Landmark, b: Landmark): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

export function normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
  if (landmarks.length === 0) return [];

  const hipCenter = midpoint(landmarks[23], landmarks[24]);

  return landmarks.map((lm) => ({
    x: lm.x - hipCenter.x,
    y: lm.y - hipCenter.y,
    z: lm.z - hipCenter.z,
    visibility: lm.visibility,
  }));
}

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 29], [29, 31], // left foot
  [28, 30], [30, 32], // right foot
];

export function getCommonAngles(landmarks: Landmark[]): Record<string, number> {
  const L = POSE_LANDMARKS;
  return {
    leftElbow: calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_ELBOW], landmarks[L.LEFT_WRIST]),
    rightElbow: calculateAngle(landmarks[L.RIGHT_SHOULDER], landmarks[L.RIGHT_ELBOW], landmarks[L.RIGHT_WRIST]),
    leftShoulder: calculateAngle(landmarks[L.LEFT_ELBOW], landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP]),
    rightShoulder: calculateAngle(landmarks[L.RIGHT_ELBOW], landmarks[L.RIGHT_SHOULDER], landmarks[L.RIGHT_HIP]),
    leftHip: calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_KNEE]),
    rightHip: calculateAngle(landmarks[L.RIGHT_SHOULDER], landmarks[L.RIGHT_HIP], landmarks[L.RIGHT_KNEE]),
    leftKnee: calculateAngle(landmarks[L.LEFT_HIP], landmarks[L.LEFT_KNEE], landmarks[L.LEFT_ANKLE]),
    rightKnee: calculateAngle(landmarks[L.RIGHT_HIP], landmarks[L.RIGHT_KNEE], landmarks[L.RIGHT_ANKLE]),
    leftAnkle: calculateAngle(landmarks[L.LEFT_KNEE], landmarks[L.LEFT_ANKLE], landmarks[L.LEFT_FOOT_INDEX]),
    rightAnkle: calculateAngle(landmarks[L.RIGHT_KNEE], landmarks[L.RIGHT_ANKLE], landmarks[L.RIGHT_FOOT_INDEX]),
    torsoLean: calculateAngle(landmarks[L.LEFT_SHOULDER], landmarks[L.LEFT_HIP], landmarks[L.LEFT_KNEE]),
  };
}
