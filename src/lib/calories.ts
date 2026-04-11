import { Gender, ActivityLevel, WeightGoal } from "@/types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Mifflin-St Jeor equation for BMR estimation.
 * Uses weight in lbs, height in inches, age in years.
 */
export function calculateBMR(
  weightLbs: number,
  heightInches: number,
  age: number,
  gender: Gender
): number {
  const weightKg = weightLbs * 0.453592;
  const heightCm = heightInches * 2.54;

  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === "female") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  // For "other", use average of male and female
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return (male + female) / 2;
}

export function calculateTDEE(
  weightLbs: number,
  heightInches: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel
): number {
  const bmr = calculateBMR(weightLbs, heightInches, age, gender);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateRecommendedCalories(
  weightLbs: number,
  heightInches: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: WeightGoal
): number {
  const tdee = calculateTDEE(weightLbs, heightInches, age, gender, activityLevel);

  switch (goal) {
    case "lose":
      return Math.max(1200, tdee - 500); // 500 cal deficit, floor of 1200
    case "gain":
      return tdee + 400; // 400 cal surplus
    case "maintain":
    default:
      return tdee;
  }
}

export function getGoalLabel(goal: WeightGoal): string {
  switch (goal) {
    case "lose": return "Lose Weight";
    case "gain": return "Gain Weight";
    case "maintain": return "Maintain Weight";
  }
}

export function getActivityLabel(level: ActivityLevel): string {
  switch (level) {
    case "sedentary": return "Sedentary (desk job)";
    case "light": return "Light (1-3 days/week)";
    case "moderate": return "Moderate (3-5 days/week)";
    case "active": return "Active (6-7 days/week)";
    case "very_active": return "Very Active (2x/day)";
  }
}
