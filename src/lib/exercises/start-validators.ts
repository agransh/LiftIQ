import { Landmark } from "@/types";
import { POSE_LANDMARKS as L, getCommonAngles, calculateAngle } from "@/lib/pose/angle-utils";
import { classifyPoseFamily, PoseFamily, PoseFamilyResult } from "@/lib/pose/pose-family";

export interface ValidationResult {
  isValid: boolean;
  /** 0..1 — how confident we are in the verdict. */
  confidence: number;
  /** Short, user-readable reasons (used for UI hints + voice cues). */
  reasons: string[];
  detectedFamily: PoseFamily;
  /** Friendly label for the *currently observed* pose, e.g. "standing", "squat-like", "plank-like". */
  detectedPoseLabel?: string;
}

type StartValidator = (
  landmarks: Landmark[],
  family: PoseFamilyResult,
  angles: Record<string, number>,
) => ValidationResult;

/**
 * Map each exercise to the coarse pose family it must START in. The rep
 * detector also uses this map to know when the user has clearly drifted
 * off the exercise mid-set.
 */
export const REQUIRED_FAMILY: Record<string, PoseFamily> = {
  pushup: "floor_plank",
  plank: "floor_plank",
  "mountain-climber": "floor_plank",
  burpee: "standing", // rep starts standing, then drops to plank
  squat: "standing",
  lunge: "standing",
  "jumping-jack": "standing",
  "shoulder-press": "standing",
  "bicep-curl": "standing",
  situp: "seated_floor",
};

function vis(lm: Landmark | undefined): number {
  return lm?.visibility ?? 0;
}

/** Friendly label for the user's CURRENT pose, used to say "looks more like X". */
function describePose(family: PoseFamily, angles: Record<string, number>): string {
  if (family === "floor_plank") return "plank-like";
  if (family === "seated_floor") return "seated";
  if (family === "kneeling") return "kneeling";
  if (family === "standing") {
    const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
    if (avgKnee < 130) return "squat-like";
    return "standing";
  }
  return "unclear";
}

function familyLabel(family: PoseFamily): string {
  switch (family) {
    case "floor_plank": return "plank";
    case "seated_floor": return "seated/lying";
    case "kneeling": return "kneeling";
    case "standing": return "standing upright";
    default: return "an unclear pose";
  }
}

function familyMismatchReasons(
  required: PoseFamily,
  observed: PoseFamilyResult,
  angles: Record<string, number>,
): string[] {
  const observedLabel = describePose(observed.family, angles);
  const reasons: string[] = [];

  if (required === "floor_plank") {
    reasons.push("Get into a plank/push-up position on the floor.");
    if (observed.family === "standing") reasons.push(`You appear to be ${observedLabel}.`);
  } else if (required === "standing") {
    reasons.push("Stand upright with your full body in view.");
    if (observed.family === "floor_plank") reasons.push("You appear to be on the floor.");
    else if (observed.family === "seated_floor") reasons.push("You appear to be seated.");
  } else if (required === "seated_floor") {
    reasons.push("Lie down on your back to begin.");
    if (observed.family === "standing") reasons.push("You appear to be standing.");
  }

  return reasons;
}

// ---------- per-exercise validators ----------

const validateStanding: StartValidator = (_lm, family, angles) => {
  const required: PoseFamily = "standing";
  const reasons: string[] = [];
  if (family.family !== required) {
    return {
      isValid: false,
      confidence: family.confidence,
      reasons: familyMismatchReasons(required, family, angles),
      detectedFamily: family.family,
      detectedPoseLabel: describePose(family.family, angles),
    };
  }
  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
  if (avgKnee < 155) reasons.push("Stand with your knees fully extended.");
  return {
    isValid: reasons.length === 0,
    confidence: family.confidence,
    reasons,
    detectedFamily: family.family,
    detectedPoseLabel: describePose(family.family, angles),
  };
};

const validateSquat: StartValidator = validateStanding;
const validateLunge: StartValidator = validateStanding;
const validateJumpingJack: StartValidator = (_lm, family, angles) => {
  const base = validateStanding(_lm, family, angles);
  if (!base.isValid) return base;
  const avgShoulder = (angles.leftShoulder + angles.rightShoulder) / 2;
  if (avgShoulder > 80) {
    return {
      ...base,
      isValid: false,
      reasons: ["Start with your arms relaxed at your sides."],
    };
  }
  return base;
};

const validateShoulderPress: StartValidator = (_lm, family, angles) => {
  const base = validateStanding(_lm, family, angles);
  if (!base.isValid) return base;
  const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
  // Press starts with arms in the rack: elbows ~70–110°, NOT extended overhead.
  if (avgElbow > 130) {
    return {
      ...base,
      isValid: false,
      reasons: ["Bring the weights to your shoulders to begin."],
    };
  }
  return base;
};

const validateBicepCurl: StartValidator = (_lm, family, angles) => {
  const base = validateStanding(_lm, family, angles);
  if (!base.isValid) return base;
  const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
  if (avgElbow < 145) {
    return {
      ...base,
      isValid: false,
      reasons: ["Start with your arms fully extended down at your sides."],
    };
  }
  return base;
};

const validateBurpee: StartValidator = validateStanding;

const validatePushup: StartValidator = (lm, family, angles) => {
  const required: PoseFamily = "floor_plank";
  const reasons: string[] = [];

  if (family.family !== required) {
    return {
      isValid: false,
      confidence: family.confidence,
      reasons: familyMismatchReasons(required, family, angles),
      detectedFamily: family.family,
      detectedPoseLabel: describePose(family.family, angles),
    };
  }

  // At the TOP of a push-up the elbows should be mostly extended.
  const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
  if (avgElbow < 140) {
    reasons.push("Start at the top with your arms extended.");
  }

  // Hips shouldn't be excessively piked (>165° back is fine, but anything < 150° = sag/pike).
  if (vis(lm[L.LEFT_SHOULDER]) > 0.4 && vis(lm[L.LEFT_HIP]) > 0.4 && vis(lm[L.LEFT_ANKLE]) > 0.4) {
    const bodyAngleL = calculateAngle(lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP], lm[L.LEFT_ANKLE]);
    const bodyAngleR = calculateAngle(lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP], lm[L.RIGHT_ANKLE]);
    const bodyAngle = (bodyAngleL + bodyAngleR) / 2;
    if (bodyAngle < 155) {
      reasons.push(
        lm[L.LEFT_HIP].y > lm[L.LEFT_SHOULDER].y + 0.05
          ? "Lift your hips so your body is straight."
          : "Lower your hips so your body is straight.",
      );
    }
  }

  // Wrists should be visible — both hands on the floor.
  const wristsOk =
    vis(lm[L.LEFT_WRIST]) > 0.5 && vis(lm[L.RIGHT_WRIST]) > 0.5;
  if (!wristsOk) reasons.push("Keep both hands in view.");

  return {
    isValid: reasons.length === 0,
    confidence: family.confidence,
    reasons,
    detectedFamily: family.family,
    detectedPoseLabel: describePose(family.family, angles),
  };
};

const validatePlank: StartValidator = (lm, family, angles) => {
  const required: PoseFamily = "floor_plank";
  if (family.family !== required) {
    return {
      isValid: false,
      confidence: family.confidence,
      reasons: familyMismatchReasons(required, family, angles),
      detectedFamily: family.family,
      detectedPoseLabel: describePose(family.family, angles),
    };
  }
  const reasons: string[] = [];
  const bodyAngleL = calculateAngle(lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP], lm[L.LEFT_ANKLE]);
  const bodyAngleR = calculateAngle(lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP], lm[L.RIGHT_ANKLE]);
  const bodyAngle = (bodyAngleL + bodyAngleR) / 2;
  if (bodyAngle < 160) reasons.push("Keep your body in a straight line.");
  return {
    isValid: reasons.length === 0,
    confidence: family.confidence,
    reasons,
    detectedFamily: family.family,
    detectedPoseLabel: describePose(family.family, angles),
  };
};

const validateMountainClimber: StartValidator = validatePlank;

const validateSitup: StartValidator = (_lm, family, angles) => {
  const required: PoseFamily = "seated_floor";
  // We're permissive here — situp can read as plank-ish or seated depending on angle.
  if (family.family !== required && family.family !== "floor_plank") {
    return {
      isValid: false,
      confidence: family.confidence,
      reasons: familyMismatchReasons(required, family, angles),
      detectedFamily: family.family,
      detectedPoseLabel: describePose(family.family, angles),
    };
  }
  const avgHip = (angles.leftHip + angles.rightHip) / 2;
  // At the BOTTOM of a sit-up the torso is flat, hip ~> 150°.
  if (avgHip < 130) {
    return {
      isValid: false,
      confidence: family.confidence,
      reasons: ["Lie flat on your back to begin."],
      detectedFamily: family.family,
      detectedPoseLabel: describePose(family.family, angles),
    };
  }
  return {
    isValid: true,
    confidence: family.confidence,
    reasons: [],
    detectedFamily: family.family,
    detectedPoseLabel: describePose(family.family, angles),
  };
};

const VALIDATORS: Record<string, StartValidator> = {
  pushup: validatePushup,
  plank: validatePlank,
  "mountain-climber": validateMountainClimber,
  burpee: validateBurpee,
  squat: validateSquat,
  lunge: validateLunge,
  "jumping-jack": validateJumpingJack,
  "shoulder-press": validateShoulderPress,
  "bicep-curl": validateBicepCurl,
  situp: validateSitup,
};

/**
 * Validate that the user is in the correct STARTING pose for the selected
 * exercise. Returns a structured verdict + human-readable reasons.
 *
 * If no validator is registered for the exercise, falls back to a permissive
 * "any reasonable upright body" check so the existing flow doesn't break.
 */
export function validateStartPosition(
  exerciseId: string,
  landmarks: Landmark[],
): ValidationResult {
  const family = classifyPoseFamily(landmarks);
  const angles = getCommonAngles(landmarks);
  const validator = VALIDATORS[exerciseId];

  if (!validator) {
    // Unknown exercise — accept any reasonable pose family.
    const acceptable: PoseFamily[] = ["standing", "floor_plank", "seated_floor", "kneeling"];
    return {
      isValid: acceptable.includes(family.family),
      confidence: family.confidence,
      reasons: acceptable.includes(family.family) ? [] : ["Step into the camera view."],
      detectedFamily: family.family,
      detectedPoseLabel: describePose(family.family, angles),
    };
  }

  return validator(landmarks, family, angles);
}

export { familyLabel };
