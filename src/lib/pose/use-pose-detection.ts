"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { Landmark, PoseDetectionStatus } from "@/types";
import { SKELETON_CONNECTIONS } from "./angle-utils";
import "@/lib/pose/mediapipe-console-filter";

interface UsePoseDetectionOptions {
  onFrame?: (landmarks: Landmark[]) => void;
  /**
   * Returns colors for specific joint indices (used by the live overlay to tint
   * targeted/issue joints). Called on every redraw so colors stay live with state.
   */
  getJointColors?: (landmarks: Landmark[]) => Map<number, string> | undefined;
  enabled?: boolean;
  facingMode?: "user" | "environment";
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function usePoseDetection({
  onFrame,
  getJointColors,
  enabled = true,
  facingMode = "user",
}: UsePoseDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(-1);
  const lastVideoTimeRef = useRef<number>(-1);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const modelReadyRef = useRef<boolean>(false);
  const [status, setStatus] = useState<PoseDetectionStatus>("loading");
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  // Refs are kept fresh during render so the rAF loop always sees the latest
  // callback identity without having to invalidate `detect`.
  const onFrameRef = useRef(onFrame);
  const getJointColorsRef = useRef(getJointColors);
  onFrameRef.current = onFrame;
  getJointColorsRef.current = getJointColors;
  // Tracks how many consecutive detection frames returned no pose. We use this
  // to decide when to clear the overlay so a stale skeleton can never linger.
  const noPoseFramesRef = useRef(0);

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

  /**
   * Pure draw routine — paints a polished 33-joint skeleton onto any 2D context.
   *
   * Coordinates are mapped through an object-cover transform so the skeleton
   * stays visually attached to the body inside the displayed video box, even
   * when the source video aspect ratio differs from the box aspect ratio.
   *
   * `boxW`/`boxH`  — the canvas drawing area in *its own* pixel space.
   * `srcW`/`srcH`  — the source frame the landmarks were normalized against.
   */
  const drawSkeletonToCtx = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      boxW: number,
      boxH: number,
      srcW: number,
      srcH: number,
      landmarks: Landmark[],
      jointColors?: Map<number, string>,
      opts?: { clear?: boolean },
    ) => {
      if (opts?.clear !== false) ctx.clearRect(0, 0, boxW, boxH);
      if (boxW <= 0 || boxH <= 0 || srcW <= 0 || srcH <= 0) return;

      // object-cover transform: scale so the source fills the box (cropping the
      // overflow), centered.
      const scale = Math.max(boxW / srcW, boxH / srcH);
      const drawnW = srcW * scale;
      const drawnH = srcH * scale;
      const ox = (boxW - drawnW) / 2;
      const oy = (boxH - drawnH) / 2;
      const projX = (nx: number) => ox + nx * drawnW;
      const projY = (ny: number) => oy + ny * drawnH;

      const mobile = isMobileDevice();
      const lineWidth = mobile ? 2.5 : 3.5;
      const baseRadius = mobile ? 4 : 5;
      const targetRadius = mobile ? 6 : 7;

      // Bone glow pass
      ctx.save();
      ctx.shadowColor = "rgba(0, 230, 170, 0.55)";
      ctx.shadowBlur = mobile ? 10 : 14;
      ctx.strokeStyle = "rgba(0, 230, 170, 0.85)";
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      for (const [start, end] of SKELETON_CONNECTIONS) {
        const a = landmarks[start];
        const b = landmarks[end];
        if (a && b && (a.visibility ?? 1) > 0.5 && (b.visibility ?? 1) > 0.5) {
          ctx.beginPath();
          ctx.moveTo(projX(a.x), projY(a.y));
          ctx.lineTo(projX(b.x), projY(b.y));
          ctx.stroke();
        }
      }
      ctx.restore();

      // Joints — draw all 33 with halo + core + inner highlight for visibility
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if ((lm.visibility ?? 1) < 0.5) continue;

        const x = projX(lm.x);
        const y = projY(lm.y);
        const overrideColor = jointColors?.get(i);
        const isTarget = jointColors?.has(i) ?? false;
        const color = overrideColor || "#00ffaa";
        const radius = isTarget ? targetRadius : baseRadius;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = isTarget ? (mobile ? 12 : 16) : mobile ? 6 : 9;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, radius * 0.35), 0, 2 * Math.PI);
        ctx.fill();

        if (isTarget) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 2.5, 0, 2 * Math.PI);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    },
    [],
  );

  /**
   * Sync the live overlay canvas to its displayed CSS box and (re)paint the
   * skeleton. Call this on every detection frame so the overlay can never lag
   * behind the user's movement. Pass `null` landmarks to clear without drawing.
   */
  const renderLiveSkeleton = useCallback(
    (landmarks: Landmark[] | null, jointColors?: Map<number, string>) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Match the canvas's internal pixel buffer to its displayed CSS size, at
      // device pixel ratio. This keeps the skeleton crisp AND ensures the
      // drawing area has the same aspect ratio as the on-screen video box —
      // the prerequisite for landmarks landing on the correct body parts.
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;

      const srcW = video.videoWidth || targetW;
      const srcH = video.videoHeight || targetH;

      // Always clear before drawing so a previous frame's skeleton can never
      // linger and create the illusion of a "frozen" overlay.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!landmarks || landmarks.length === 0) return;

      drawSkeletonToCtx(
        ctx,
        canvas.width,
        canvas.height,
        srcW,
        srcH,
        landmarks,
        jointColors,
        { clear: false },
      );
    },
    [drawSkeletonToCtx],
  );

  // Public wrapper — kept for legacy callers (e.g. the recording compositor).
  const drawSkeleton = useCallback(
    (landmarks: Landmark[], jointColors?: Map<number, string>) => {
      renderLiveSkeleton(landmarks, jointColors);
    },
    [renderLiveSkeleton],
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
      const raw = result?.landmarks?.[0];
      if (raw && raw.length > 0) {
        const lms: Landmark[] = raw.map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility,
        }));
        noPoseFramesRef.current = 0;
        setLandmarks(lms);
        setStatus("detecting");

        // Notify the consumer FIRST so any state-driven joint colors (e.g.
        // form issues) are computed BEFORE we paint this frame.
        onFrameRef.current?.(lms);

        // Then paint the live overlay using the freshest landmarks + colors.
        // This is the single source of truth for the on-screen skeleton, so it
        // can never get stuck on a stale frame.
        const colors = getJointColorsRef.current?.(lms);
        renderLiveSkeleton(lms, colors);
      } else {
        // No pose this frame — bump the miss counter and clear the overlay
        // after a brief grace period so the skeleton doesn't appear frozen.
        noPoseFramesRef.current += 1;
        if (noPoseFramesRef.current >= 3) {
          renderLiveSkeleton(null);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("XNNPACK") || msg.includes("delegate")) {
        // Delegate init artefact — safe to ignore
      }
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, [renderLiveSkeleton]);

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

  return { videoRef, canvasRef, landmarks, status, drawSkeleton, drawSkeletonToCtx } as const;
}
