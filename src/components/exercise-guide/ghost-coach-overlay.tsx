"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { getExerciseGuide, type PoseFrame } from "@/lib/exercises/exercise-visual-guides";
import { getExercise } from "@/lib/exercises";
import { getCommonAngles, POSE_LANDMARKS as L } from "@/lib/pose/angle-utils";
import type { Landmark } from "@/types";

interface GhostCoachOverlayProps {
  exerciseId: string;
  /** Latest MediaPipe landmarks; the ghost mirrors the user's pace from these. */
  landmarks: Landmark[] | null;
  /** True when the on-screen video is mirrored (front camera). */
  mirror?: boolean;
  /**
   * Compact rendering — thinner bones, no glow, no decorative head ring.
   * Use on small screens where the full ghost competes with the live overlay
   * for screen real estate.
   */
  compact?: boolean;
  onDismiss: () => void;
  /** Outward ref so the recording compositor can sample this canvas. */
  canvasRefExternal?: RefObject<HTMLCanvasElement | null>;
}

type MutableCanvasRef = { current: HTMLCanvasElement | null };

// Smoothing weights: alpha applied to the *new* sample (0.6 = snappy, 0.2 = laggy).
// Position is more aggressive than rep-progress so the ghost tracks the user
// without visible inertia, but doesn't jitter.
const POS_ALPHA = 0.4;
const T_ALPHA = 0.55;

const CORE_LANDMARKS = [
  L.LEFT_SHOULDER,
  L.RIGHT_SHOULDER,
  L.LEFT_HIP,
  L.RIGHT_HIP,
  L.LEFT_KNEE,
  L.RIGHT_KNEE,
  L.LEFT_ANKLE,
  L.RIGHT_ANKLE,
];
const VIS_THRESHOLD = 0.5;

interface PoseExtent {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface UserAnchor {
  /** Body box in canvas pixel space. */
  box: { x: number; y: number; w: number; h: number };
  /** -1 = body angled toward the user's left, +1 = right (from shoulder z-depth). */
  facing: -1 | 1;
  /**
   * Horizontal distance between the shoulders in normalized [0,1] coords.
   * Wide → user is facing the camera. Narrow → user is side-on.
   * `null` if shoulders aren't reliably tracked this frame.
   */
  shoulderSpread: number | null;
}

type Orientation = "front" | "side";

// Shoulder-spread thresholds for orientation classification (normalized coords).
// We use hysteresis so the ghost doesn't ping-pong between views on borderline
// frames — once committed, the user has to clearly turn before we switch.
const FRONT_ENTER = 0.13;
const SIDE_ENTER = 0.06;

function lerpFrame(a: PoseFrame, b: PoseFrame, t: number): PoseFrame {
  const out: PoseFrame = {};
  for (const key of Object.keys(a)) {
    if (!b[key]) continue;
    out[key] = {
      x: a[key].x + (b[key].x - a[key].x) * t,
      y: a[key].y + (b[key].y - a[key].y) * t,
    };
  }
  return out;
}

/**
 * Picks the keyframe that's *furthest* from frame 0 in joint space — that's
 * the "bottom" / peak-effort pose for nearly every exercise we ship.
 */
function pickBottomFrameIndex(frames: PoseFrame[]): number {
  if (frames.length <= 1) return 0;
  const top = frames[0];
  let bestIdx = 1;
  let bestDist = -1;
  for (let i = 1; i < frames.length; i++) {
    let dist = 0;
    for (const k of Object.keys(top)) {
      const a = top[k];
      const b = frames[i][k];
      if (!a || !b) continue;
      dist += Math.hypot(a.x - b.x, a.y - b.y);
    }
    if (dist > bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Compute the user's body box in canvas pixel space, applying the same
 * object-cover transform the live overlay uses so the ghost lines up with the
 * actual person on screen.
 */
function computeUserAnchor(
  landmarks: Landmark[],
  canvasW: number,
  canvasH: number,
  srcW: number,
  srcH: number,
): UserAnchor | null {
  // Use only well-tracked landmarks so the box doesn't snap to a flickering one.
  const visible = CORE_LANDMARKS
    .map((idx) => landmarks[idx])
    .filter((lm) => lm && (lm.visibility ?? 0) >= VIS_THRESHOLD);
  if (visible.length < 4) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const lm of visible) {
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }

  // Include head/nose vertically when available so the box covers the full body.
  const head = landmarks[L.NOSE];
  if (head && (head.visibility ?? 0) >= 0.4 && head.y < minY) minY = head.y;

  // object-cover transform (matches use-pose-detection.ts).
  const scale = Math.max(canvasW / srcW, canvasH / srcH);
  const drawnW = srcW * scale;
  const drawnH = srcH * scale;
  const ox = (canvasW - drawnW) / 2;
  const oy = (canvasH - drawnH) / 2;
  const projX = (nx: number) => ox + nx * drawnW;
  const projY = (ny: number) => oy + ny * drawnH;

  const px = projX(minX);
  const py = projY(minY);
  const pw = projX(maxX) - px;
  const ph = projY(maxY) - py;

  // Pose landmarker reports z relative to the hip; positive z = away from the
  // camera. If the right shoulder is further away, the user is angled toward
  // their left, so they're "facing right" in the frame.
  const ls = landmarks[L.LEFT_SHOULDER];
  const rs = landmarks[L.RIGHT_SHOULDER];
  const lz = ls?.z ?? 0;
  const rz = rs?.z ?? 0;
  const facing: -1 | 1 = rz > lz ? 1 : -1;

  // Shoulder spread is only meaningful when both shoulders are well tracked —
  // otherwise we'd flip orientation every time one shoulder hides.
  const shoulderSpread =
    ls && rs && (ls.visibility ?? 0) >= 0.5 && (rs.visibility ?? 0) >= 0.5
      ? Math.abs(ls.x - rs.x)
      : null;

  return {
    box: { x: px, y: py, w: pw, h: ph },
    facing,
    shoulderSpread,
  };
}

/**
 * Where the user is in the rep, normalized so 1 = start (top) and 0 = full
 * depth. For exercises without a `repCycle` (e.g. plank) we just clamp to 1.
 */
function computeRepProgress(
  exerciseId: string,
  landmarks: Landmark[],
): number {
  const cfg = getExercise(exerciseId);
  const cycle = cfg?.repCycle;
  if (!cycle) return 1;

  const angles = getCommonAngles(landmarks);
  const vals = cycle.primaryAngles.map((k) => angles[k] ?? 0).filter((v) => v > 0);
  if (vals.length === 0) return 1;

  const method = cycle.combineMethod ?? "average";
  const primary =
    method === "min"
      ? Math.min(...vals)
      : method === "max"
      ? Math.max(...vals)
      : vals.reduce((a, b) => a + b, 0) / vals.length;

  const fullRange = Math.abs(cycle.startThreshold - cycle.depthThreshold);
  if (fullRange < 1) return 1;
  const distFromDepth = Math.abs(primary - cycle.depthThreshold);
  return Math.max(0, Math.min(1, distFromDepth / fullRange));
}

export function GhostCoachOverlay({
  exerciseId,
  landmarks,
  mirror = false,
  compact = false,
  onDismiss,
  canvasRefExternal,
}: GhostCoachOverlayProps) {
  const guide = getExerciseGuide(exerciseId);
  const compactRef = useRef(compact);
  useLayoutEffect(() => {
    compactRef.current = compact;
  }, [compact]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Stash the outward ref in a ref so the callback below isn't a prop closure
  // (keeps eslint's "no prop mutation" rule happy and avoids re-binding the
  // ref callback every render).
  const externalRef = useRef<MutableCanvasRef | null>(null);
  useLayoutEffect(() => {
    externalRef.current = (canvasRefExternal ?? null) as MutableCanvasRef | null;
  }, [canvasRefExternal]);

  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    const ext = externalRef.current;
    if (ext) ext.current = node;
  }, []);

  // Pre-computed once per exercise so the per-frame draw stays cheap. Both
  // side and front variants are baked here; the rAF loop just picks one.
  const guideMeta = useMemo(() => {
    if (!guide) return null;

    const buildVariant = (
      frames: PoseFrame[],
      connections: [string, string][],
      highlightJoints: string[],
    ) => {
      const bottomIdx = pickBottomFrameIndex(frames);
      const topFrame = frames[0];
      const bottomFrame = frames[bottomIdx];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const frame of [topFrame, bottomFrame]) {
        for (const k of Object.keys(frame)) {
          const p = frame[k];
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
      }
      return {
        topFrame,
        bottomFrame,
        extent: { minX, maxX, minY, maxY } as PoseExtent,
        connections,
        highlightJoints: new Set(highlightJoints),
      };
    };

    const side = buildVariant(guide.keyframes, guide.connections, guide.highlightJoints);
    const front = guide.frontKeyframes && guide.frontConnections
      ? buildVariant(
          guide.frontKeyframes,
          guide.frontConnections,
          guide.frontHighlightJoints ?? guide.highlightJoints,
        )
      : null;

    return {
      side,
      front,
      defaultOrientation: guide.recommendedView as Orientation,
    };
  }, [guide]);

  // Smoothed state lives in refs so the rAF loop can read it without
  // re-rendering. The ghost moves by repainting, not by React updates.
  const tRef = useRef(1);
  const ghostBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const facingRef = useRef<-1 | 1>(1);
  // Sticky orientation — see FRONT_ENTER / SIDE_ENTER hysteresis in draw().
  const orientationRef = useRef<Orientation | null>(null);
  const latestLandmarksRef = useRef<Landmark[] | null>(landmarks);
  // Sync the latest landmarks into the ref *before* the next paint so the rAF
  // tick always sees the freshest pose without re-creating the draw closure.
  useLayoutEffect(() => {
    latestLandmarksRef.current = landmarks;
  }, [landmarks]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !guideMeta) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to its displayed CSS box (DPR-aware) so the ghost lines up
    // with the live skeleton overlay, which is sized the same way.
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lms = latestLandmarksRef.current;
    if (!lms || lms.length === 0) return;

    // Don't render junk: if too few core landmarks are well-tracked, leave
    // the canvas blank rather than show a half-broken ghost. This is
    // especially important on phones where the overlay competes with the
    // live skeleton for visual attention.
    const wellTracked = CORE_LANDMARKS.reduce(
      (n, idx) => n + (((lms[idx]?.visibility ?? 0) >= VIS_THRESHOLD) ? 1 : 0),
      0,
    );
    if (wellTracked < 5) return;

    // We don't have the source video element here — assume the source aspect
    // matches the canvas (it does in practice because the live overlay sets
    // the same CSS box). For mismatched aspects the user-anchor will simply
    // be a touch off; the ghost still tracks pace, which is the user's ask.
    const srcW = canvas.width;
    const srcH = canvas.height;

    const anchor = computeUserAnchor(lms, canvas.width, canvas.height, srcW, srcH);
    if (!anchor || anchor.box.h < 40) return;

    // ── Orientation (front vs side) ────────────────────────────────────
    // Front view is only available when the exercise has frontKeyframes.
    // Otherwise we always render the side variant — no point in switching to
    // a view we can't draw.
    if (orientationRef.current === null) {
      orientationRef.current = guideMeta.front
        ? guideMeta.defaultOrientation
        : "side";
    }
    if (guideMeta.front && anchor.shoulderSpread !== null) {
      const cur = orientationRef.current;
      if (cur === "side" && anchor.shoulderSpread > FRONT_ENTER) {
        orientationRef.current = "front";
      } else if (cur === "front" && anchor.shoulderSpread < SIDE_ENTER) {
        orientationRef.current = "side";
      }
    }
    const variant =
      orientationRef.current === "front" && guideMeta.front
        ? guideMeta.front
        : guideMeta.side;

    // Smooth rep progress so the ghost reads as natural-paced motion, not
    // detection-quantum jumps.
    const tRaw = computeRepProgress(exerciseId, lms);
    tRef.current = tRef.current * (1 - T_ALPHA) + tRaw * T_ALPHA;
    const t = tRef.current;

    // ── Ghost target box (pixel space on this canvas) ──────────────────
    const { extent } = variant;
    const guideAspect = (extent.maxX - extent.minX) / Math.max(1, extent.maxY - extent.minY);
    const ghostH = anchor.box.h;
    const ghostW = ghostH * guideAspect;
    const gap = Math.max(12, anchor.box.w * 0.25);

    // Choose the side with more empty room. Ghost stays inside the canvas.
    const userRightEdge = anchor.box.x + anchor.box.w;
    const userLeftEdge = anchor.box.x;
    const spaceRight = canvas.width - userRightEdge;
    const spaceLeft = userLeftEdge;
    let ghostX: number;
    if (spaceRight >= ghostW + gap || spaceRight >= spaceLeft) {
      ghostX = Math.min(canvas.width - ghostW - 4, userRightEdge + gap);
    } else {
      ghostX = Math.max(4, userLeftEdge - gap - ghostW);
    }
    // Foot-align: ghost's feet sit on the same y-line as the user's.
    const ghostY = anchor.box.y + anchor.box.h - ghostH;

    // Smooth box position so quick MediaPipe nudges don't make the ghost
    // pop. First frame jumps directly to avoid an awkward fly-in.
    const prev = ghostBoxRef.current;
    const target = { x: ghostX, y: ghostY, w: ghostW, h: ghostH };
    const smoothed = prev
      ? {
          x: prev.x * (1 - POS_ALPHA) + target.x * POS_ALPHA,
          y: prev.y * (1 - POS_ALPHA) + target.y * POS_ALPHA,
          w: prev.w * (1 - POS_ALPHA) + target.w * POS_ALPHA,
          h: prev.h * (1 - POS_ALPHA) + target.h * POS_ALPHA,
        }
      : target;
    ghostBoxRef.current = smoothed;

    facingRef.current = anchor.facing;

    // ── Pose interpolation ────────────────────────────────────────────
    // t = 1 → top/start, t = 0 → bottom/depth. Keyframes go top → bottom, so
    // the ghost interpolation weight is (1 - t).
    const pose = lerpFrame(variant.topFrame, variant.bottomFrame, 1 - t);

    // ── Draw skeleton inside ghost box ────────────────────────────────
    const extentW = extent.maxX - extent.minX;
    const extentH = extent.maxY - extent.minY;
    const projJx = (px: number) => smoothed.x + ((px - extent.minX) / extentW) * smoothed.w;
    const projJy = (py: number) => smoothed.y + ((py - extent.minY) / extentH) * smoothed.h;

    // Side keyframes face "right" in their viewbox. Mirror the ghost shape
    // inside its bbox when the user's body is angled the other way, so the
    // coach faces the same direction as the person they're standing next to.
    // Front keyframes are bilaterally symmetric — mirroring is a no-op there.
    // The canvas's outer CSS `scaleX(-1)` (when mirror=true) is independent —
    // it flips the entire overlay along with the video, keeping the ghost
    // visually consistent with the user's reflected view.
    const flipShape =
      orientationRef.current === "side" && facingRef.current === -1;
    const flipX = (x: number) =>
      flipShape ? smoothed.x + smoothed.w - (x - smoothed.x) : x;

    const isCompact = compactRef.current;

    // Bones — full mode: cyan glow holographic look.
    //         compact:    slim, glow-free strokes for small screens.
    ctx.save();
    if (!isCompact) {
      ctx.shadowColor = "rgba(56, 189, 248, 0.55)";
      ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = isCompact ? "rgba(56, 189, 248, 0.7)" : "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = Math.max(isCompact ? 1.5 : 2, smoothed.h * (isCompact ? 0.008 : 0.012));
    ctx.lineCap = "round";
    for (const [from, to] of variant.connections) {
      const a = pose[from];
      const b = pose[to];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(flipX(projJx(a.x)), projJy(a.y));
      ctx.lineTo(flipX(projJx(b.x)), projJy(b.y));
      ctx.stroke();
    }
    ctx.restore();

    // Joints
    const baseR = Math.max(isCompact ? 2 : 3, smoothed.h * (isCompact ? 0.014 : 0.02));
    for (const [name, p] of Object.entries(pose)) {
      const isHi = variant.highlightJoints.has(name);
      const r = isHi ? baseR * 1.4 : baseR;
      const color = isHi ? "rgba(168, 85, 247, 0.95)" : "rgba(56, 189, 248, 0.95)";
      ctx.save();
      if (!isCompact) {
        ctx.shadowColor = color;
        ctx.shadowBlur = isHi ? 14 : 8;
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(flipX(projJx(p.x)), projJy(p.y), r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!isCompact) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(flipX(projJx(p.x)), projJy(p.y), r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Decorative head ring — only in full mode. The compact ghost stays as
    // close to "highlighted joints" as we can without losing readability.
    if (!isCompact && pose.head) {
      const headR = Math.max(6, smoothed.h * 0.04);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = Math.max(1.5, smoothed.h * 0.01);
      ctx.save();
      ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(flipX(projJx(pose.head.x)), projJy(pose.head.y) - headR * 0.4, headR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [exerciseId, guideMeta]);

  // Keep the latest `draw` reachable from a single rAF chain. Splitting the
  // chain from the closure prevents the loop from getting cancelled (and a
  // visible "freeze") whenever React re-renders with new props.
  const drawRef = useRef(draw);
  useLayoutEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    // Reset smoothing + orientation when the exercise changes so the ghost
    // doesn't "fly" from the previous exercise's pose into the new one and so
    // the next exercise picks up its own recommended view.
    tRef.current = 1;
    ghostBoxRef.current = null;
    orientationRef.current = null;
  }, [exerciseId]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      drawRef.current();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!guide) return null;

  return (
    <div className="absolute inset-0 z-15 pointer-events-none">
      <canvas
        ref={setCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: mirror ? "scaleX(-1)" : "none" }}
      />
      <button
        onClick={onDismiss}
        className="pointer-events-auto absolute top-12 left-3 h-9 w-9 rounded-full bg-black/70 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center text-purple-300 hover:text-white hover:bg-black/90 transition-all active:scale-90"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute bottom-3 right-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          Ghost Coach
        </span>
      </div>
    </div>
  );
}
