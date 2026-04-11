import { ExerciseConfig } from "@/types";
import { squatConfig } from "./squat";
import { pushupConfig } from "./pushup";
import { lungeConfig } from "./lunge";
import { plankConfig } from "./plank";
import { situpConfig } from "./situp";
import { jumpingJackConfig } from "./jumping-jack";
import { mountainClimberConfig } from "./mountain-climber";
import { shoulderPressConfig } from "./shoulder-press";
import { bicepCurlConfig } from "./bicep-curl";
import { burpeeConfig } from "./burpee";

export const exercises: Record<string, ExerciseConfig> = {
  squat: squatConfig,
  pushup: pushupConfig,
  lunge: lungeConfig,
  plank: plankConfig,
  situp: situpConfig,
  "jumping-jack": jumpingJackConfig,
  "mountain-climber": mountainClimberConfig,
  "shoulder-press": shoulderPressConfig,
  "bicep-curl": bicepCurlConfig,
  burpee: burpeeConfig,
};

export const exerciseList = Object.values(exercises);

export function getExercise(id: string): ExerciseConfig | undefined {
  return exercises[id];
}
