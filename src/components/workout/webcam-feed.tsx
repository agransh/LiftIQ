"use client";

import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { usePoseDetection } from "@/lib/pose/use-pose-detection";
import { useWorkoutStore } from "@/lib/store";
import { RepDetector } from "@/lib/scoring/rep-detector";
import { getExercise } from "@/lib/exercises";
import { Landmark, JointFeedback } from "@/types";
import { getVoiceProvider } from "@/lib/ai/voice";
import { Loader2, Camera, CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebcamFeedProps {
  mobile?: boolean;
}

export function WebcamFeed({ mobile = false }: WebcamFeedProps) {
  const {
    selectedExercise,
    isWorkoutActive,
    isPaused,
    isRecording,
    setCurrentScore,
    setRepCount,
    setCurrentPhase,
    setCurrentCues,
    setCurrentIssues,
    addRepResult,
    setRecordingBlob,
    settings,
    setPoseStatus,
  } = useWorkoutStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const repDetectorRef = useRef<RepDetector | null>(null);
  const exerciseRef = useRef(selectedExercise);

  useEffect(() => {
    const config = getExercise(selectedExercise);
    if (config) {
      repDetectorRef.current = new RepDetector(config);
      exerciseRef.current = selectedExercise;
    } else {
      repDetectorRef.current = null;
    }
  }, [selectedExercise]);

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
      if (!isWorkoutActive || isPaused || !repDetectorRef.current) return;

      const result = repDetectorRef.current.update(landmarks);
      setCurrentScore(result.score);
      setRepCount(result.repCount);
      setCurrentPhase(result.phase);
      setCurrentCues(result.cues);
      setCurrentIssues(result.issues);

      if (result.repCompleted && result.repResult) {
        addRepResult(result.repResult);
      }

      if (settings.voiceEnabled && result.cues.length > 0) {
        const voice = getVoiceProvider();
        voice.speak(result.cues[0]);
      }

      const config = getExercise(exerciseRef.current);
      const jointColors = getJointColors(result.issues, config);
      drawSkeletonRef.current(landmarks, jointColors);
    },
    [
      isWorkoutActive,
      isPaused,
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
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

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
      {status === "detecting" && !isWorkoutActive && (
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
