import { WorkoutSession, DailyLog, StreakData, UserSettings, UserProfile, FoodEntry, UserExercise } from "@/types";

const STORAGE_KEYS = {
  SESSIONS: "liftiq-sessions",
  DAILY_LOGS: "liftiq-daily-logs",
  STREAK: "liftiq-streak",
  SETTINGS: "liftiq-settings",
  PROFILE: "liftiq-profile",
  FOOD_LOG: "liftiq-food-log",
  USER_EXERCISES: "liftiq-user-exercises",
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("Failed to save to localStorage");
  }
}

// ── User Profile ──────────────────────────────────────────────

export function getUserProfile(): UserProfile | null {
  return getItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
}

export function saveUserProfile(profile: UserProfile): void {
  setItem(STORAGE_KEYS.PROFILE, profile);
}

export function hasCompletedOnboarding(): boolean {
  const profile = getUserProfile();
  return profile?.hasCompletedOnboarding ?? false;
}

// ── User Exercises (custom exercise library) ──────────────────

export function getUserExercises(): UserExercise[] {
  return getItem<UserExercise[]>(STORAGE_KEYS.USER_EXERCISES, []);
}

export function saveUserExercise(exercise: UserExercise): void {
  const exercises = getUserExercises();
  const idx = exercises.findIndex((e) => e.id === exercise.id);
  if (idx >= 0) {
    exercises[idx] = exercise;
  } else {
    exercises.push(exercise);
  }
  setItem(STORAGE_KEYS.USER_EXERCISES, exercises);
}

export function deleteUserExercise(id: string): void {
  const exercises = getUserExercises().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.USER_EXERCISES, exercises);
}

// ── Sessions ──────────────────────────────────────────────────

export function getSessions(): WorkoutSession[] {
  return getItem<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);
}

export function saveSession(session: WorkoutSession): void {
  const sessions = getSessions();
  sessions.push(session);
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  updateDailyLog(session);
}

// ── Daily Logs ────────────────────────────────────────────────

export function getDailyLogs(): DailyLog[] {
  return getItem<DailyLog[]>(STORAGE_KEYS.DAILY_LOGS, []);
}

function updateDailyLog(session: WorkoutSession): void {
  const logs = getDailyLogs();
  const dateStr = new Date(session.startTime).toISOString().split("T")[0];
  const existing = logs.find((l) => l.date === dateStr);

  if (existing) {
    existing.sessions.push(session);
    existing.totalReps += session.reps.length;
    existing.avgScore = Math.round(
      existing.sessions.reduce((sum, s) => sum + s.totalScore, 0) / existing.sessions.length
    );
  } else {
    logs.push({
      date: dateStr,
      sessions: [session],
      totalCalories: 0,
      totalReps: session.reps.length,
      avgScore: session.totalScore,
    });
  }

  setItem(STORAGE_KEYS.DAILY_LOGS, logs);
}

// ── Streaks ───────────────────────────────────────────────────

export function getStreakData(): StreakData {
  return getItem<StreakData>(STORAGE_KEYS.STREAK, {
    currentStreak: 0,
    bestStreak: 0,
    lastWorkoutDate: "",
    workoutDates: [],
  });
}

export function updateStreak(): StreakData {
  const streak = getStreakData();
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

  setItem(STORAGE_KEYS.STREAK, streak);
  return streak;
}

// ── Settings ──────────────────────────────────────────────────

export function getSettings(): UserSettings {
  return getItem<UserSettings>(STORAGE_KEYS.SETTINGS, {
    voiceEnabled: false,
    sensitivity: "medium",
    cameraFacing: "user",
  });
}

export function saveSettings(settings: UserSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
}

// ── Food / Calorie Log ────────────────────────────────────────

export function getFoodLog(): FoodEntry[] {
  return getItem<FoodEntry[]>(STORAGE_KEYS.FOOD_LOG, []);
}

export function addFoodEntry(entry: FoodEntry): void {
  const log = getFoodLog();
  log.push(entry);
  setItem(STORAGE_KEYS.FOOD_LOG, log);
}

export function deleteFoodEntry(id: string): void {
  const log = getFoodLog().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.FOOD_LOG, log);
}

export function getTodayFoodCalories(): number {
  const today = new Date().toISOString().split("T")[0];
  return getFoodLog()
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.calories, 0);
}

export function getTodayFoodEntries(): FoodEntry[] {
  const today = new Date().toISOString().split("T")[0];
  return getFoodLog().filter((e) => e.date === today);
}
