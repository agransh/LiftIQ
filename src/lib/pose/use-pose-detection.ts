"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Landmark, PoseDetectionStatus } from "@/types";
import { SKELETON_CONNECTIONS } from "./angle-utils";

interface UsePoseDetectionOptions {
  onFrame?: (landmarks: Landmark[]) => void;
  enabled?: boolean;
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function usePoseDetection({ onFrame, enabled = true }: UsePoseDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const poseLandmarkerRef = useRef<any>(null);
  const [status, setStatus] = useState<PoseDetectionStatus>("loading");
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const initCamera = useCallback(async () => {
    try {
      const mobile = isMobileDevice();
      const constraints: MediaStreamConstraints = {
        video: mobile
          ? {
              facingMode: "user",
              width: { ideal: 480 },
              height: { ideal: 640 },
            }
          : {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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

      const mobile = isMobileDevice();
      const poseLandmarker = await PoseLandmarker.createFromOptions(wasmFiles, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: mobile ? "CPU" : "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      poseLandmarkerRef.current = poseLandmarker;
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

    if (!video || !poseLandmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const result = poseLandmarker.detectForVideo(video, performance.now());
      if (result.landmarks && result.landmarks.length > 0) {
        const lms: Landmark[] = result.landmarks[0].map((l: any) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility,
        }));
        setLandmarks(lms);
        setStatus("detecting");
        onFrameRef.current?.(lms);
      }
    } catch {
      // Frame processing error — continue
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function start() {
      const cameraOk = await initCamera();
      if (!cameraOk || !mounted) return;
      const poseOk = await initPoseDetection();
      if (!poseOk || !mounted) return;
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
  }, [enabled, initCamera, initPoseDetection, detect]);

  return { videoRef, canvasRef, landmarks, status, drawSkeleton } as const;
}
