"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { Landmark, PoseDetectionStatus } from "@/types";
import { SKELETON_CONNECTIONS } from "./angle-utils";
import "@/lib/pose/mediapipe-console-filter";

interface UsePoseDetectionOptions {
  onFrame?: (landmarks: Landmark[]) => void;
  enabled?: boolean;
  facingMode?: "user" | "environment";
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function usePoseDetection({ onFrame, enabled = true, facingMode = "user" }: UsePoseDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(-1);
  const lastVideoTimeRef = useRef<number>(-1);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const modelReadyRef = useRef<boolean>(false);
  const [status, setStatus] = useState<PoseDetectionStatus>("loading");
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const initCamera = useCallback(async (facing: "user" | "environment") => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }

    const mobile = isMobileDevice();
    const isRear = facing === "environment";

    const buildConstraints = (exact: boolean): MediaStreamConstraints => {
      const facingMode = exact ? { exact: facing } as const : facing;

      if (mobile) {
        return {
          video: {
            facingMode,
            width: { ideal: isRear ? 1280 : 480 },
            height: { ideal: isRear ? 720 : 640 },
            frameRate: { ideal: 30 },
          },
        };
      }
      return {
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      };
    };

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(buildConstraints(true));
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(buildConstraints(false));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        await videoRef.current.play();
      }
      return true;
    } catch {
      setStatus("no-camera");
      return false;
    }
  }, []);

  const initPoseDetection = useCallback(async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { PoseLandmarker, FilesetResolver } = vision;

      const wasmFiles = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const modelAssetPath =
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

      const baseOpts = (delegate: "GPU" | "CPU") => ({
        baseOptions: { modelAssetPath, delegate },
        runningMode: "VIDEO" as const,
        numPoses: 1,
      });

      // Prefer GPU (WebGL): avoids TFLite XNNPACK CPU delegate on many setups.
      let poseLandmarker: Awaited<ReturnType<typeof PoseLandmarker.createFromOptions>> | null =
        null;
      try {
        poseLandmarker = await PoseLandmarker.createFromOptions(wasmFiles, baseOpts("GPU"));
      } catch {
        poseLandmarker = await PoseLandmarker.createFromOptions(wasmFiles, baseOpts("CPU"));
      }

      poseLandmarkerRef.current = poseLandmarker;
      lastTimestampRef.current = performance.now();
      setStatus("ready");
      return true;
    } catch (err) {
      console.error("Pose detection init error:", err);
      setStatus("error");
      return false;
    }
  }, []);

  const drawSkeleton = useCallback(
    (landmarks: Landmark[], jointColors?: Map<number, string>) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mobile = isMobileDevice();
      const lineWidth = mobile ? 2 : 3;
      const baseRadius = mobile ? 4 : 5;
      const targetRadius = mobile ? 6 : 7;

      // Draw connections
      ctx.strokeStyle = "rgba(0, 255, 170, 0.6)";
      ctx.lineWidth = lineWidth;
      for (const [start, end] of SKELETON_CONNECTIONS) {
        const a = landmarks[start];
        const b = landmarks[end];
        if (a && b && (a.visibility ?? 1) > 0.5 && (b.visibility ?? 1) > 0.5) {
          ctx.beginPath();
          ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
          ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
          ctx.stroke();
        }
      }

      // Draw joints
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if ((lm.visibility ?? 1) < 0.5) continue;

        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        const color = jointColors?.get(i) || "#00ffaa";
        const radius = jointColors?.has(i) ? targetRadius : baseRadius;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        if (jointColors?.has(i)) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    },
    []
  );

  const detect = useCallback(() => {
    const video = videoRef.current;
    const poseLandmarker = poseLandmarkerRef.current;

    if (!video || !poseLandmarker || !modelReadyRef.current || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Skip if the video hasn't advanced to a new frame
    if (video.currentTime === lastVideoTimeRef.current) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }
    lastVideoTimeRef.current = video.currentTime;

    const now = performance.now();
    if (now <= lastTimestampRef.current) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }
    lastTimestampRef.current = now;

    try {
      const result = poseLandmarker.detectForVideo(video, now);
      if (result?.landmarks && result.landmarks.length > 0) {
        const lms: Landmark[] = result.landmarks[0].map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility,
        }));
        setLandmarks(lms);
        setStatus("detecting");
        onFrameRef.current?.(lms);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("XNNPACK") || msg.includes("delegate")) {
        // Delegate init artefact — safe to ignore
      }
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  // Initial mount: start camera + load pose model
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function start() {
      const cameraOk = await initCamera(facingMode);
      if (!cameraOk || !mounted) return;
      const poseOk = await initPoseDetection();
      if (!poseOk || !mounted) return;

      modelReadyRef.current = true;
      animFrameRef.current = requestAnimationFrame(detect);
    }

    start();

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      poseLandmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Camera switch: re-acquire stream when facingMode changes (model stays loaded)
  const facingModeRef = useRef(facingMode);
  useEffect(() => {
    if (facingModeRef.current === facingMode) return;
    facingModeRef.current = facingMode;
    initCamera(facingMode);
  }, [facingMode, initCamera]);

  return { videoRef, canvasRef, landmarks, status, drawSkeleton } as const;
}
