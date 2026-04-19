import { WorkoutSession, DailyLog, StreakData, UserSettings, UserProfile, FoodEntry, UserExercise, WorkoutRoutine } from "@/types";
import * as db from "@/lib/supabase-db";
import { clearAllRecordings } from "@/lib/storage/recordings-db";

const STORAGE_KEYS = {
  SESSIONS: "liftiq-sessions",
  DAILY_LOGS: "liftiq-daily-logs",
  STREAK: "liftiq-streak",
  SETTINGS: "liftiq-settings",
  PROFILE: "liftiq-profile",
  FOOD_LOG: "liftiq-food-log",
  USER_EXERCISES: "liftiq-user-exercises",
  ROUTINES: "liftiq-routines",
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

const OWNER_KEY = "liftiq-data-owner";

export function clearAllStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
  localStorage.removeItem(OWNER_KEY);
  clearAllRecordings().catch(() => {});
}

export function ensureStorageOwner(userId: string): void {
  if (typeof window === "undefined") return;
  const current = localStorage.getItem(OWNER_KEY);
  if (current && current !== userId) {
    clearAllStorage();
  }
  localStorage.setItem(OWNER_KEY, userId);
}

// ── User Profile ──────────────────────────────────────────────

export function getUserProfile(): UserProfile | null {
  return getItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const profile = await db.dbGetProfile();
  if (profile) {
    setItem(STORAGE_KEYS.PROFILE, profile);
  }
  return profile;
}

export function saveUserProfile(profile: UserProfile): void {
  setItem(STORAGE_KEYS.PROFILE, profile);
  db.dbSaveProfile(profile);
}

export function hasCompletedOnboarding(): boolean {
  const profile = getUserProfile();
  return profile?.hasCompletedOnboarding ?? false;
}

export async function fetchHasCompletedOnboarding(): Promise<boolean> {
  const profile = await fetchUserProfile();
  return profile?.hasCompletedOnboarding ?? false;
}

// ── User Exercises ────────────────────────────────────────────

export function getUserExercises(): UserExercise[] {
  return getItem<UserExercise[]>(STORAGE_KEYS.USER_EXERCISES, []);
}

export async function fetchUserExercises(): Promise<UserExercise[]> {
  const exercises = await db.dbGetUserExercises();
  setItem(STORAGE_KEYS.USER_EXERCISES, exercises);
  return exercises;
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
  db.dbSaveUserExercise(exercise);
}

export function deleteUserExercise(id: string): void {
  const exercises = getUserExercises().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.USER_EXERCISES, exercises);
  db.dbDeleteUserExercise(id);
}

// ── Sessions ──────────────────────────────────────────────────

export function getSessions(): WorkoutSession[] {
  return getItem<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);
}

export async function fetchSessions(): Promise<WorkoutSession[]> {
  const sessions = await db.dbGetSessions();
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  return sessions;
}

export function saveSession(session: WorkoutSession): void {
  const sessions = getSessions();
  sessions.push(session);
  setItem(STORAGE_KEYS.SESSIONS, sessions);
  updateDailyLog(session);
  db.dbSaveSession(session);
}

// ── Daily Logs (derived from sessions, computed client-side) ──

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

export function rebuildDailyLogs(sessions: WorkoutSession[]): DailyLog[] {
  const logMap: Record<string, DailyLog> = {};
  for (const s of sessions) {
    const dateStr = new Date(s.startTime).toISOString().split("T")[0];
    if (!logMap[dateStr]) {
      logMap[dateStr] = { date: dateStr, sessions: [], totalCalories: 0, totalReps: 0, avgScore: 0 };
    }
    logMap[dateStr].sessions.push(s);
    logMap[dateStr].totalReps += s.reps.length;
  }
  const logs = Object.values(logMap).map((log) => {
    log.avgScore = log.sessions.length > 0
      ? Math.round(log.sessions.reduce((sum, s) => sum + s.totalScore, 0) / log.sessions.length)
      : 0;
    return log;
  });
  setItem(STORAGE_KEYS.DAILY_LOGS, logs);
  return logs;
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

export async function fetchStreakData(): Promise<StreakData> {
  const streak = await db.dbGetStreakData();
  setItem(STORAGE_KEYS.STREAK, streak);
  return streak;
}

export async function updateStreak(): Promise<StreakData> {
  const streak = await db.dbUpdateStreak();
  setItem(STORAGE_KEYS.STREAK, streak);
  return streak;
}

// ── Settings ──────────────────────────────────────────────────

export function getSettings(): UserSettings {
  return getItem<UserSettings>(STORAGE_KEYS.SETTINGS, {
    voiceEnabled: false,
    sensitivity: "medium",
    cameraFacing: "user",
    coachingMode: "ghost",
  });
}

export async function fetchSettings(): Promise<UserSettings> {
  const settings = await db.dbGetSettings();
  setItem(STORAGE_KEYS.SETTINGS, settings);
  return settings;
}

export function saveSettings(settings: UserSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  db.dbSaveSettings(settings);
}

// ── Food / Calorie Log ────────────────────────────────────────

export function getFoodLog(): FoodEntry[] {
  return getItem<FoodEntry[]>(STORAGE_KEYS.FOOD_LOG, []);
}

export async function fetchFoodLog(): Promise<FoodEntry[]> {
  const log = await db.dbGetFoodLog();
  setItem(STORAGE_KEYS.FOOD_LOG, log);
  return log;
}

export function addFoodEntry(entry: FoodEntry): void {
  const log = getFoodLog();
  log.push(entry);
  setItem(STORAGE_KEYS.FOOD_LOG, log);
  db.dbAddFoodEntry(entry);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("food-changed"));
}

export function deleteFoodEntry(id: string): void {
  const log = getFoodLog().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.FOOD_LOG, log);
  db.dbDeleteFoodEntry(id);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("food-changed"));
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

export async function fetchTodayFoodCalories(): Promise<number> {
  return db.dbGetTodayFoodCalories();
}

export async function fetchTodayFoodEntries(): Promise<FoodEntry[]> {
  return db.dbGetTodayFoodEntries();
}

// ── Workout Routines ──────────────────────────────────────────

export function getRoutines(): WorkoutRoutine[] {
  return getItem<WorkoutRoutine[]>(STORAGE_KEYS.ROUTINES, []);
}

export async function fetchRoutines(): Promise<WorkoutRoutine[]> {
  const routines = await db.dbGetRoutines();
  setItem(STORAGE_KEYS.ROUTINES, routines);
  return routines;
}

export function saveRoutine(routine: WorkoutRoutine): void {
  const routines = getRoutines();
  const idx = routines.findIndex((r) => r.id === routine.id);
  if (idx >= 0) {
    routines[idx] = routine;
  } else {
    routines.push(routine);
  }
  setItem(STORAGE_KEYS.ROUTINES, routines);
  db.dbSaveRoutine(routine);
}

export function deleteRoutine(id: string): void {
  const routines = getRoutines().filter((r) => r.id !== id);
  setItem(STORAGE_KEYS.ROUTINES, routines);
  db.dbDeleteRoutine(id);
}
