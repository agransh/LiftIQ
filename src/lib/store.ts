import { create } from "zustand";
import { RepResult, JointFeedback, WorkoutSession, UserSettings, UserProfile, PoseDetectionStatus } from "@/types";

interface WorkoutState {
  // Pose detection
  poseStatus: PoseDetectionStatus;
  setPoseStatus: (status: PoseDetectionStatus) => void;

  // Exercise
  selectedExercise: string;
  setSelectedExercise: (exercise: string) => void;
  /** True after user picks an exercise (grid, My Exercises, or routine) — gates camera + start */
  hasSelectedExercise: boolean;
  setHasSelectedExercise: (value: boolean) => void;

  // Workout session
  isWorkoutActive: boolean;
  isPaused: boolean;
  isRecording: boolean;
  sessionStartTime: number | null;
  sessionWeight: number | undefined;
  startWorkout: (recording?: boolean) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  stopWorkout: () => void;
  setSessionWeight: (weight: number | undefined) => void;

  // Real-time metrics
  currentScore: number;
  setCurrentScore: (score: number) => void;
  repCount: number;
  setRepCount: (count: number) => void;
  currentPhase: string;
  setCurrentPhase: (phase: string) => void;
  currentCues: string[];
  setCurrentCues: (cues: string[]) => void;
  currentIssues: JointFeedback[];
  setCurrentIssues: (issues: JointFeedback[]) => void;

  // Rep history
  repResults: RepResult[];
  addRepResult: (rep: RepResult) => void;
  clearRepResults: () => void;

  // Recording
  recordingBlob: Blob | null;
  setRecordingBlob: (blob: Blob | null) => void;

  // Post-workout
  lastSession: WorkoutSession | null;
  setLastSession: (session: WorkoutSession | null) => void;

  // User profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  poseStatus: "loading",
  setPoseStatus: (status) => set({ poseStatus: status }),

  selectedExercise: "",
  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),
  hasSelectedExercise: false,
  setHasSelectedExercise: (value) => set({ hasSelectedExercise: value }),

  isWorkoutActive: false,
  isPaused: false,
  isRecording: false,
  sessionStartTime: null,
  sessionWeight: undefined,
  startWorkout: (recording = false) =>
    set({
      isWorkoutActive: true,
      isPaused: false,
      isRecording: recording,
      sessionStartTime: Date.now(),
      repCount: 0,
      repResults: [],
      currentScore: 100,
    }),
  pauseWorkout: () => set({ isPaused: true }),
  resumeWorkout: () => set({ isPaused: false }),
  stopWorkout: () => set({ isWorkoutActive: false, isPaused: false, isRecording: false }),
  setSessionWeight: (weight) => set({ sessionWeight: weight }),

  currentScore: 100,
  setCurrentScore: (score) => set({ currentScore: score }),
  repCount: 0,
  setRepCount: (count) => set({ repCount: count }),
  currentPhase: "",
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  currentCues: [],
  setCurrentCues: (cues) => set({ currentCues: cues }),
  currentIssues: [],
  setCurrentIssues: (issues) => set({ currentIssues: issues }),

  repResults: [],
  addRepResult: (rep) => set((state) => ({ repResults: [...state.repResults, rep] })),
  clearRepResults: () => set({ repResults: [] }),

  recordingBlob: null,
  setRecordingBlob: (blob) => set({ recordingBlob: blob }),

  lastSession: null,
  setLastSession: (session) => set({ lastSession: session }),

  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  settings: {
    voiceEnabled: false,
    sensitivity: "medium",
    cameraFacing: "user",
  },
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
