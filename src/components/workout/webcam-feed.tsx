"use client";

import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { useWorkoutStore } from "@/lib/store";
import { RepDetector } from "@/lib/scoring/rep-detector";
import { getExercise } from "@/lib/exercises";
import { getCommonAngles } from "@/lib/pose/angle-utils";
import { Landmark, JointFeedback } from "@/types";
import { getVoiceManager, classifyCuePriority } from "@/lib/ai/voice";
import { Loader2, Camera, CameraOff, SwitchCamera, CheckCircle2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

const FORM_CHECK_REQUIRED_FRAMES = 15;

interface WebcamFeedProps {
  mobile?: boolean;
}

export function WebcamFeed({ mobile = false }: WebcamFeedProps) {
  const {
    selectedExercise,
    isWorkoutActive,
    isPaused,
    isRecording,
    isCountingDown,
    isFormChecking,
    countdownSeconds,
    setCountdownSeconds,
    finishCountdown,
    passFormCheck,
    setCurrentScore,
    setRepCount,
    setCurrentPhase,
    setCurrentCues,
    setCurrentIssues,
    addRepResult,
    setRecordingBlob,
    settings,
    updateSettings,
    setPoseStatus,
  } = useWorkoutStore();

  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(settings.cameraFacing || "user");
  const [formCheckProgress, setFormCheckProgress] = useState(0);
  const [formDetectedBanner, setFormDetectedBanner] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const repDetectorRef = useRef<RepDetector | null>(null);
  const exerciseRef = useRef(selectedExercise);
  const formCheckFramesRef = useRef(0);
  const { setVoiceInfo } = useWorkoutStore();

  // ── Countdown timer ──
  useEffect(() => {
    if (!isCountingDown || countdownSeconds <= 0) return;
    const timer = setTimeout(() => {
      const next = countdownSeconds - 1;
      if (next <= 0) {
        finishCountdown();
      } else {
        setCountdownSeconds(next);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isCountingDown, countdownSeconds, setCountdownSeconds, finishCountdown]);

  const handleFlipCamera = () => {
    const next = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(next);
    updateSettings({ cameraFacing: next });
  };

  // Wire VoiceManager state changes into Zustand for UI reactivity
  useEffect(() => {
    const vm = getVoiceManager();
    const unsub = vm.onChange((info) => setVoiceInfo(info));
    return () => { unsub(); };
  }, [setVoiceInfo]);

  useEffect(() => {
    const config = getExercise(selectedExercise);
    if (config) {
      repDetectorRef.current = new RepDetector(config);
      exerciseRef.current = selectedExercise;
    } else {
      repDetectorRef.current = null;
    }
    getVoiceManager().resetFrameCounts();
  }, [selectedExercise]);

  // Reset form-check tracking when entering form-check phase
  useEffect(() => {
    if (isFormChecking) {
      formCheckFramesRef.current = 0;
      setFormCheckProgress(0);
      setFormDetectedBanner(false);
    }
  }, [isFormChecking]);

  // Fresh RepDetector when workout starts so stale phase state doesn't cause ghost reps
  useEffect(() => {
    if (isWorkoutActive) {
      const config = getExercise(exerciseRef.current);
      if (config) {
        repDetectorRef.current = new RepDetector(config);
      }
    }
  }, [isWorkoutActive]);

  // Manage voice coach lifecycle: stop on workout end, pause/resume, and mute on toggle
  useEffect(() => {
    const vm = getVoiceManager();
    if (!isWorkoutActive) {
      vm.resetSession();
    } else if (isPaused || !settings.voiceEnabled) {
      vm.pause();
    } else {
      vm.resume();
    }
  }, [isWorkoutActive, isPaused, settings.voiceEnabled]);

  const drawSkeletonRef = useRef<
    (landmarks: Landmark[], jointColors?: Map<number, string>) => void
  >(() => {});

  const getJointColors = useCallback(
    (issues: JointFeedback[], config: ReturnType<typeof getExercise>) => {
      const colors = new Map<number, string>();
      if (!config) return colors;

      for (const joint of config.targetJoints) {
        colors.set(joint, "#00e68a");
      }

      for (const issue of issues) {
        const color =
          issue.status === "poor"
            ? "#f87171"
            : issue.status === "moderate"
            ? "#facc15"
            : "#00e68a";

        const jointMapping: Record<string, number[]> = {
          knees: [25, 26],
          leftKnee: [25],
          rightKnee: [26],
          frontKnee: [25, 26],
          backKnee: [25, 26],
          hips: [23, 24],
          torso: [11, 12, 23, 24],
          elbows: [13, 14],
          arms: [13, 14, 15, 16],
          shoulders: [11, 12],
        };

        const indices = jointMapping[issue.joint] || [];
        for (const idx of indices) {
          colors.set(idx, color);
        }
      }

      return colors;
    },
    []
  );

  const handleFrame = useCallback(
    (landmarks: Landmark[]) => {
      const KEY_LANDMARKS = [11, 12, 13, 14, 23, 24];
      const MIN_VISIBILITY = 0.6;
      const visibleCount = KEY_LANDMARKS.filter(
        (idx) => landmarks[idx] && (landmarks[idx].visibility ?? 0) >= MIN_VISIBILITY
      ).length;

      // ── Form-check phase: detect starting position before counting reps ──
      if (isFormChecking) {
        const config = getExercise(exerciseRef.current);
        if (!config) return;

        // Draw skeleton even during form check for visual feedback
        drawSkeletonRef.current(landmarks);

        if (visibleCount < 4) {
          formCheckFramesRef.current = 0;
          setFormCheckProgress(0);
          return;
        }

        const angles = getCommonAngles(landmarks);
        const detectedPhase = config.detectPhase(angles, landmarks);
        const startPhase = config.phases[0];

        if (detectedPhase === startPhase) {
          formCheckFramesRef.current++;
          setFormCheckProgress(Math.min(100, Math.round((formCheckFramesRef.current / FORM_CHECK_REQUIRED_FRAMES) * 100)));

          if (formCheckFramesRef.current >= FORM_CHECK_REQUIRED_FRAMES) {
            setFormDetectedBanner(true);
            setTimeout(() => {
              passFormCheck();
              setFormDetectedBanner(false);
            }, 2000);
          }
        } else {
          formCheckFramesRef.current = Math.max(0, formCheckFramesRef.current - 2);
          setFormCheckProgress(Math.min(100, Math.round((formCheckFramesRef.current / FORM_CHECK_REQUIRED_FRAMES) * 100)));
        }
        return;
      }

      // ── Normal workout: count reps ──
      if (!isWorkoutActive || isPaused || !repDetectorRef.current) return;
      if (visibleCount < 4) return;

      const result = repDetectorRef.current.update(landmarks);
      setCurrentScore(result.score);
      setRepCount(result.repCount);
      setCurrentPhase(result.phase);
      setCurrentCues(result.cues);
      setCurrentIssues(result.issues);

      if (result.repCompleted && result.repResult) {
        addRepResult(result.repResult);
      }

      if (settings.voiceEnabled) {
        const vm = getVoiceManager();
        const meta = { exercise: exerciseRef.current, phase: result.phase, repCount: result.repCount, score: result.score };
        for (const cue of result.cues) {
          vm.speakCue(cue, classifyCuePriority(cue), meta);
        }
        if (result.repCompleted) {
          vm.speakEncouragement(result.repCount);
        }
      }

      const config = getExercise(exerciseRef.current);
      const jointColors = getJointColors(result.issues, config);
      drawSkeletonRef.current(landmarks, jointColors);
    },
    [
      isWorkoutActive,
      isPaused,
      isFormChecking,
      passFormCheck,
      setCurrentScore,
      setRepCount,
      setCurrentPhase,
      setCurrentCues,
      setCurrentIssues,
      addRepResult,
      settings.voiceEnabled,
      getJointColors,
    ]
  );

  const { videoRef, canvasRef, status, drawSkeleton } = usePoseDetection({
    onFrame: handleFrame,
    enabled: true,
    facingMode: cameraFacing,
  });

  useLayoutEffect(() => {
    drawSkeletonRef.current = drawSkeleton;
  }, [drawSkeleton]);

  useEffect(() => {
    setPoseStatus(status);
  }, [status, setPoseStatus]);

  // Start/stop MediaRecorder based on recording state
  useEffect(() => {
    if (isWorkoutActive && isRecording && videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      recordedChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      try {
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            setRecordingBlob(blob);
          }
          recordedChunksRef.current = [];
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch {
        console.warn("MediaRecorder not supported");
      }
    }

    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [isWorkoutActive, isRecording, videoRef, setRecordingBlob]);

  return (
    <div
      className={cn(
        "webcam-container relative bg-black overflow-hidden",
        mobile
          ? "w-full h-full rounded-none border-0"
          : "aspect-video rounded-2xl"
      )}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={cameraFacing === "user" ? { transform: "scaleX(-1)" } : undefined}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={cameraFacing === "user" ? { transform: "scaleX(-1)" } : undefined}
      />

      {/* Camera flip button */}
      {status === "detecting" && (
        <button
          onClick={handleFlipCamera}
          className={cn(
            "absolute z-20 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:bg-black/70 active:scale-95",
            mobile ? "top-3 right-3 h-9 w-9" : "top-4 right-4 h-10 w-10"
          )}
          title={cameraFacing === "user" ? "Switch to back camera" : "Switch to front camera"}
        >
          <SwitchCamera className={cn("text-white", mobile ? "h-4 w-4" : "h-5 w-5")} />
        </button>
      )}

      {/* Countdown overlay */}
      {isCountingDown && countdownSeconds > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">Get into position</div>
            <div
              key={countdownSeconds}
              className="text-8xl md:text-9xl font-black text-white tabular-nums animate-[pulse_1s_ease-in-out]"
              style={{ textShadow: "0 0 40px rgba(6,182,212,0.4)" }}
            >
              {countdownSeconds}
            </div>
            <div className="mt-4 w-48 mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdownSeconds) / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form-check overlay */}
      {isFormChecking && !formDetectedBanner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30">
          <div className="text-center px-6">
            <div className="relative mx-auto mb-4 h-16 w-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin"
                style={{ animationDuration: "1.5s" }}
              />
              <ScanLine className="h-7 w-7 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-400 mb-2">
              Analyzing Your Form
            </div>
            <div className="text-xs text-white/60 mb-4">
              Get into the starting position for this exercise
            </div>
            <div className="w-48 mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${formCheckProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-white/40 mt-2 tabular-nums">
              {formCheckProgress < 100 ? "Hold your position..." : "Almost there..."}
            </div>
          </div>
        </div>
      )}

      {/* Form detected banner */}
      {formDetectedBanner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-30">
          <div className="text-center px-6 animate-[fadeIn_0.4s_ease-out]">
            <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400 mb-1">
              Form Detected!
            </div>
            <div className="text-sm text-white/70">
              Starting rep count now
            </div>
          </div>
        </div>
      )}

      {/* Status overlays */}
      {(status === "loading" || status === "ready") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <Loader2 className={cn("text-primary animate-spin mb-4", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-muted-foreground text-center px-8", mobile ? "text-xs" : "text-sm")}>
            {status === "loading"
              ? "Loading pose detection model..."
              : "Camera ready — waiting for detection..."}
          </p>
        </div>
      )}

      {status === "no-camera" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <CameraOff className={cn("text-destructive mb-4", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-muted-foreground text-center px-8", mobile ? "text-xs" : "text-sm")}>
            Camera access denied. Please allow camera permissions and refresh.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <Camera className={cn("text-yellow-400 mb-4", mobile ? "h-8 w-8" : "h-10 w-10")} />
          <p className={cn("text-muted-foreground text-center px-8", mobile ? "text-xs" : "text-sm")}>
            Error loading pose detection. Please refresh and try again.
          </p>
        </div>
      )}

      {/* Workout not started overlay */}
      {status === "detecting" && !isWorkoutActive && !isFormChecking && !isCountingDown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <div className="glass-card rounded-xl px-6 py-4 text-center mx-4">
            <p className={cn("text-foreground", mobile ? "text-xs" : "text-sm")}>
              Select an exercise and press <strong>Start</strong> to begin
            </p>
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="glass-card rounded-xl px-8 py-6 text-center">
            <p className="text-2xl font-bold text-primary">PAUSED</p>
            <p className="text-sm text-muted-foreground mt-1">
              Press Resume to continue
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
