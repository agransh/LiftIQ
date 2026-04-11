import { createClient } from "@/utils/supabase/client";
import {
  UserProfile,
  UserSettings,
  WorkoutSession,
  FoodEntry,
  UserExercise,
  StreakData,
} from "@/types";

function getSupabase() {
  return createClient();
}

async function getUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

// ── Profile ───────────────────────────────────────────────────

export async function dbGetProfile(): Promise<UserProfile | null> {
  const uid = await getUserId();
  if (!uid) return null;

  const { data } = await getSupabase()
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();

  if (!data) return null;

  return {
    name: data.name,
    age: data.age,
    weight: Number(data.weight),
    height: data.height,
    gender: data.gender,
    activityLevel: data.activity_level,
    disabilities: data.disabilities,
    weightGoal: data.weight_goal,
    calorieGoal: data.calorie_goal,
    useRecommendedCalories: data.use_recommended_calories,
    hasCompletedOnboarding: data.has_completed_onboarding,
    createdAt: new Date(data.created_at).getTime(),
  };
}

export async function dbSaveProfile(profile: UserProfile): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await getSupabase().from("profiles").upsert({
    id: uid,
    name: profile.name,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    gender: profile.gender,
    activity_level: profile.activityLevel,
    disabilities: profile.disabilities,
    weight_goal: profile.weightGoal,
    calorie_goal: profile.calorieGoal,
    use_recommended_calories: profile.useRecommendedCalories,
    has_completed_onboarding: profile.hasCompletedOnboarding,
    updated_at: new Date().toISOString(),
  });
}

export async function dbHasCompletedOnboarding(): Promise<boolean> {
  const profile = await dbGetProfile();
  return profile?.hasCompletedOnboarding ?? false;
}

// ── Settings (stored in profiles table) ───────────────────────

export async function dbGetSettings(): Promise<UserSettings> {
  const uid = await getUserId();
  if (!uid) return { voiceEnabled: false, sensitivity: "medium", cameraFacing: "user" };

  const { data } = await getSupabase()
    .from("profiles")
    .select("voice_enabled, sensitivity, camera_facing")
    .eq("id", uid)
    .single();

  if (!data) return { voiceEnabled: false, sensitivity: "medium", cameraFacing: "user" };

  return {
    voiceEnabled: data.voice_enabled,
    sensitivity: data.sensitivity,
    cameraFacing: data.camera_facing,
  };
}

export async function dbSaveSettings(settings: UserSettings): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await getSupabase().from("profiles").update({
    voice_enabled: settings.voiceEnabled,
    sensitivity: settings.sensitivity,
    camera_facing: settings.cameraFacing,
    updated_at: new Date().toISOString(),
  }).eq("id", uid);
}

// ── Workout Sessions ──────────────────────────────────────────

export async function dbGetSessions(): Promise<WorkoutSession[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const { data } = await getSupabase()
    .from("workout_sessions")
    .select("*")
    .eq("user_id", uid)
    .order("start_time", { ascending: true });

  if (!data) return [];

  return data.map((d) => ({
    id: d.id,
    exercise: d.exercise,
    exerciseName: d.exercise_name,
    weight: d.weight ? Number(d.weight) : undefined,
    startTime: d.start_time,
    endTime: d.end_time,
    reps: d.reps as WorkoutSession["reps"],
    totalScore: d.total_score,
    caloriesBurned: Number(d.calories_burned),
    isRecorded: d.is_recorded,
  }));
}

export async function dbSaveSession(session: WorkoutSession): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await getSupabase().from("workout_sessions").insert({
    id: session.id,
    user_id: uid,
    exercise: session.exercise,
    exercise_name: session.exerciseName,
    weight: session.weight,
    start_time: session.startTime,
    end_time: session.endTime,
    reps: session.reps,
    total_score: session.totalScore,
    calories_burned: session.caloriesBurned,
    is_recorded: session.isRecorded ?? false,
  });
}

// ── Food Log ──────────────────────────────────────────────────

export async function dbGetFoodLog(): Promise<FoodEntry[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const { data } = await getSupabase()
    .from("food_log")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    calories: d.calories,
    date: d.date,
    timestamp: new Date(d.created_at).getTime(),
    meal: d.meal,
  }));
}

export async function dbAddFoodEntry(entry: FoodEntry): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await getSupabase().from("food_log").insert({
    id: entry.id,
    user_id: uid,
    name: entry.name,
    calories: entry.calories,
    date: entry.date,
    meal: entry.meal,
  });
}

export async function dbDeleteFoodEntry(id: string): Promise<void> {
  await getSupabase().from("food_log").delete().eq("id", id);
}

export async function dbGetTodayFoodCalories(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const uid = await getUserId();
  if (!uid) return 0;

  const { data } = await getSupabase()
    .from("food_log")
    .select("calories")
    .eq("user_id", uid)
    .eq("date", today);

  if (!data) return 0;
  return data.reduce((sum, d) => sum + d.calories, 0);
}

export async function dbGetTodayFoodEntries(): Promise<FoodEntry[]> {
  const today = new Date().toISOString().split("T")[0];
  const uid = await getUserId();
  if (!uid) return [];

  const { data } = await getSupabase()
    .from("food_log")
    .select("*")
    .eq("user_id", uid)
    .eq("date", today)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    calories: d.calories,
    date: d.date,
    timestamp: new Date(d.created_at).getTime(),
    meal: d.meal,
  }));
}

// ── User Exercises ────────────────────────────────────────────

export async function dbGetUserExercises(): Promise<UserExercise[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const { data } = await getSupabase()
    .from("user_exercises")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    trackingId: d.tracking_id,
    weight: d.weight ? Number(d.weight) : undefined,
    targetReps: d.target_reps,
    targetSets: d.target_sets,
    notes: d.notes,
    isCustom: d.is_custom,
    createdAt: new Date(d.created_at).getTime(),
  }));
}

export async function dbSaveUserExercise(exercise: UserExercise): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await getSupabase().from("user_exercises").upsert({
    id: exercise.id,
    user_id: uid,
    name: exercise.name,
    tracking_id: exercise.trackingId,
    weight: exercise.weight,
    target_reps: exercise.targetReps,
    target_sets: exercise.targetSets,
    notes: exercise.notes,
    is_custom: exercise.isCustom,
  });
}

export async function dbDeleteUserExercise(id: string): Promise<void> {
  await getSupabase().from("user_exercises").delete().eq("id", id);
}

// ── Streaks ───────────────────────────────────────────────────

export async function dbGetStreakData(): Promise<StreakData> {
  const uid = await getUserId();
  const fallback: StreakData = { currentStreak: 0, bestStreak: 0, lastWorkoutDate: "", workoutDates: [] };
  if (!uid) return fallback;

  const { data } = await getSupabase()
    .from("streaks")
    .select("*")
    .eq("user_id", uid)
    .single();

  if (!data) return fallback;

  return {
    currentStreak: data.current_streak,
    bestStreak: data.best_streak,
    lastWorkoutDate: data.last_workout_date,
    workoutDates: data.workout_dates as string[],
  };
}

export async function dbUpdateStreak(): Promise<StreakData> {
  const uid = await getUserId();
  const fallback: StreakData = { currentStreak: 0, bestStreak: 0, lastWorkoutDate: "", workoutDates: [] };
  if (!uid) return fallback;

  const streak = await dbGetStreakData();
  const today = new Date().toISOString().split("T")[0];

  if (streak.lastWorkoutDate === today) return streak;

  if (!streak.workoutDates.includes(today)) {
    streak.workoutDates.push(today);
  }

  const lastDate = streak.lastWorkoutDate ? new Date(streak.lastWorkoutDate) : null;
  const todayDate = new Date(today);

  if (lastDate) {
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }
  } else {
    streak.currentStreak = 1;
  }

  streak.bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
  streak.lastWorkoutDate = today;

  await getSupabase().from("streaks").upsert({
    user_id: uid,
    current_streak: streak.currentStreak,
    best_streak: streak.bestStreak,
    last_workout_date: streak.lastWorkoutDate,
    workout_dates: streak.workoutDates,
    updated_at: new Date().toISOString(),
  });

  return streak;
}
