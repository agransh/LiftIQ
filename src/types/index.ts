export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type JointStatus = "good" | "moderate" | "poor";

export interface JointFeedback {
  joint: string;
  status: JointStatus;
  message?: string;
}

export interface ExercisePhase {
  name: string;
  entryCondition: (angles: Record<string, number>, landmarks: Landmark[]) => boolean;
}

export interface RepResult {
  score: number;
  issues: JointFeedback[];
  timestamp: number;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  targetJoints: number[];
  phases: string[];
  detectPhase: (angles: Record<string, number>, landmarks: Landmark[]) => string;
  scoreRep: (angles: Record<string, number>, landmarks: Landmark[], phase: string) => {
    score: number;
    issues: JointFeedback[];
  };
  getCoachingCues: (angles: Record<string, number>, landmarks: Landmark[], phase: string) => string[];
  caloriesPerRep: number;
}

// User-created or customized exercise entry in their workout log
export interface UserExercise {
  id: string;
  name: string;
  trackingId: string; // maps to ExerciseConfig.id for pose tracking, or "custom" if untracked
  weight?: number; // in lbs
  targetReps?: number;
  targetSets?: number;
  notes?: string;
  isCustom: boolean;
  createdAt: number;
}

export interface WorkoutSession {
  id: string;
  exercise: string;
  exerciseName?: string;
  weight?: number;
  startTime: number;
  endTime?: number;
  reps: RepResult[];
  totalScore: number;
  caloriesBurned: number;
  isRecorded?: boolean;
}

export interface DailyLog {
  date: string;
  sessions: WorkoutSession[];
  totalCalories: number;
  totalReps: number;
  avgScore: number;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastWorkoutDate: string;
  workoutDates: string[];
}

export type WeightGoal = "lose" | "maintain" | "gain";
export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // lbs
  height: number; // inches
  gender: Gender;
  activityLevel: ActivityLevel;
  disabilities: string;
  weightGoal: WeightGoal;
  calorieGoal: number; // daily target
  useRecommendedCalories: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  date: string;
  timestamp: number;
  meal?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface UserSettings {
  voiceEnabled: boolean;
  sensitivity: "low" | "medium" | "high";
  cameraFacing: "user" | "environment";
}

export type PoseDetectionStatus = "loading" | "ready" | "detecting" | "error" | "no-camera";
