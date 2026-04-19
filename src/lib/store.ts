import { create } from "zustand";
import { RepResult, JointFeedback, WorkoutSession, UserSettings, UserProfile, PoseDetectionStatus, PerfectRepReason } from "@/types";
import type { VoiceState } from "@/lib/ai/voice";

interface WorkoutState {
  // Pose detection
  poseStatus: PoseDetectionStatus;
  setPoseStatus: (status: PoseDetectionStatus) => void;

  // Voice coach state (driven by VoiceManager listener)
  voiceState: VoiceState;
  voiceCurrentCue: string | null;
  voiceQueueSize: number;
  setVoiceInfo: (info: { state: VoiceState; currentCue: string | null; queueSize: number }) => void;

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
  isCountingDown: boolean;
  countdownSeconds: number;
  isFormChecking: boolean;
  sessionStartTime: number | null;
  sessionWeight: number | undefined;
  startCountdown: (recording?: boolean) => void;
  setCountdownSeconds: (seconds: number) => void;
  finishCountdown: () => void;
  cancelCountdown: () => void;
  passFormCheck: () => void;
  startWorkout: (recording?: boolean) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  stopWorkout: () => void;
  setSessionWeight: (weight: number | undefined) => void;

  /**
   * Coarse readiness signal driven by the form-check + family-drift logic.
   *  - "idle":        no exercise selected / camera off
   *  - "framing":     person isn't fully in frame yet
   *  - "wrong_pose":  in frame but the wrong pose family for the exercise
   *  - "almost":      pose is close to valid but failing one constraint
   *  - "ready":       valid start pose, holding for confirmation
   *  - "active":      workout is running and pose family is correct
   *  - "off_track":   workout is running but the user has drifted off
   */
  readiness: "idle" | "framing" | "wrong_pose" | "almost" | "ready" | "active" | "off_track";
  /** Short message paired with the readiness state, used by the readiness pill. */
  readinessMessage: string;
  setReadiness: (
    state: "idle" | "framing" | "wrong_pose" | "almost" | "ready" | "active" | "off_track",
    message?: string,
  ) => void;

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

  // Perfect rep tracking
  bestRepScore: number;
  bestRepIndex: number;
  bestRepTimestamp: number;
  bestRepReasons: PerfectRepReason[];
  perfectRepAchieved: boolean;
  perfectRepCount: number;
  dismissPerfectRep: () => void;

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

  voiceState: "idle" as VoiceState,
  voiceCurrentCue: null,
  voiceQueueSize: 0,
  setVoiceInfo: (info) => set({ voiceState: info.state, voiceCurrentCue: info.currentCue, voiceQueueSize: info.queueSize }),

  selectedExercise: "",
  setSelectedExercise: (exercise) => set({ selectedExercise: exercise }),
  hasSelectedExercise: false,
  setHasSelectedExercise: (value) => set({ hasSelectedExercise: value }),

  isWorkoutActive: false,
  isPaused: false,
  isRecording: false,
  isCountingDown: false,
  countdownSeconds: 0,
  isFormChecking: false,
  sessionStartTime: null,
  sessionWeight: undefined,
  startCountdown: (recording = false) =>
    set({
      isCountingDown: true,
      countdownSeconds: 10,
      isRecording: recording,
    }),
  setCountdownSeconds: (seconds) => set({ countdownSeconds: seconds }),
  finishCountdown: () =>
    set({
      isCountingDown: false,
      countdownSeconds: 0,
      isFormChecking: true,
      isWorkoutActive: false,
      isPaused: false,
      repCount: 0,
      repResults: [],
      currentScore: 100,
    }),
  cancelCountdown: () =>
    set({
      isCountingDown: false,
      countdownSeconds: 0,
      isFormChecking: false,
      isRecording: false,
    }),
  passFormCheck: () =>
    set({
      isFormChecking: false,
      isWorkoutActive: true,
      sessionStartTime: Date.now(),
    }),
  startWorkout: (recording = false) =>
    set({
      isWorkoutActive: true,
      isPaused: false,
      isRecording: recording,
      isFormChecking: false,
      sessionStartTime: Date.now(),
      repCount: 0,
      repResults: [],
      currentScore: 100,
    }),
  pauseWorkout: () => set({ isPaused: true }),
  resumeWorkout: () => set({ isPaused: false }),
  stopWorkout: () => set({ isWorkoutActive: false, isPaused: false, isRecording: false, isCountingDown: false, countdownSeconds: 0, isFormChecking: false, readiness: "idle", readinessMessage: "" }),
  setSessionWeight: (weight) => set({ sessionWeight: weight }),

  readiness: "idle",
  readinessMessage: "",
  setReadiness: (state, message) =>
    set((prev) =>
      prev.readiness === state && prev.readinessMessage === (message ?? "")
        ? prev
        : { readiness: state, readinessMessage: message ?? "" },
    ),

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
  addRepResult: (rep) =>
    set((state) => {
      const newResults = [...state.repResults, rep];
      const newIndex = newResults.length - 1;
      const isBest = rep.score > state.bestRepScore;

      if (!isBest) {
        const isPerfect = rep.score >= 90;
        return {
          repResults: newResults,
          perfectRepCount: state.perfectRepCount + (isPerfect ? 1 : 0),
        };
      }

      const reasons: PerfectRepReason[] = [];
      if (rep.score >= 90) reasons.push("high_score");
      if (rep.issues.length === 0) reasons.push("zero_issues");
      const issueCount = rep.issueCount ?? rep.issues.length;
      if (issueCount === 0 && rep.score >= 85) reasons.push("full_rom");
      if (rep.score >= 95) reasons.push("stable_form");
      if (newResults.length >= 2) {
        const prev = newResults[newIndex - 1];
        if (Math.abs(rep.score - prev.score) <= 5 && rep.score >= 80) reasons.push("consistent_tempo");
      }

      const isPerfect = rep.score >= 90;
      return {
        repResults: newResults,
        bestRepScore: rep.score,
        bestRepIndex: newIndex,
        bestRepTimestamp: rep.timestamp,
        bestRepReasons: reasons,
        perfectRepAchieved: isPerfect,
        perfectRepCount: state.perfectRepCount + (isPerfect ? 1 : 0),
      };
    }),
  clearRepResults: () => set({
    repResults: [],
    bestRepScore: 0,
    bestRepIndex: -1,
    bestRepTimestamp: 0,
    bestRepReasons: [],
    perfectRepAchieved: false,
    perfectRepCount: 0,
  }),

  bestRepScore: 0,
  bestRepIndex: -1,
  bestRepTimestamp: 0,
  bestRepReasons: [],
  perfectRepAchieved: false,
  perfectRepCount: 0,
  dismissPerfectRep: () => set({ perfectRepAchieved: false }),

  recordingBlob: null,
  setRecordingBlob: (blob) => set({ recordingBlob: blob }),

  lastSession: null,
  setLastSession: (session) => set({ lastSession: session }),

  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),

  settings: {
    voiceEnabled: false,
    sensitivity: "medium",
    cameraFacing: "environment",
    coachingMode: "ghost",
  },
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));
