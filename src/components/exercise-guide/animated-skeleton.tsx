"use client";

import { useRef, useEffect, useCallback, useState, type RefObject } from "react";
import { Play, Pause, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PoseFrame, ExerciseVisualGuide } from "@/lib/exercises/exercise-visual-guides";

interface AnimatedSkeletonProps {
  guide: ExerciseVisualGuide;
  width?: number;
  height?: number;
  className?: string;
  ghost?: boolean;
  showControls?: boolean;
  /** Optional outward ref so a parent (e.g. the recording compositor) can sample this canvas. */
  canvasRefExternal?: RefObject<HTMLCanvasElement | null>;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function lerpFrame(a: PoseFrame, b: PoseFrame, t: number): PoseFrame {
  const result: PoseFrame = {};
  for (const key of Object.keys(a)) {
    if (!b[key]) continue;
    result[key] = {
      x: a[key].x + (b[key].x - a[key].x) * t,
      y: a[key].y + (b[key].y - a[key].y) * t,
    };
  }
  return result;
}

const VB_W = 300;
const VB_H = 280;
const SPEEDS = [0.5, 1, 1.5] as const;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  tx: number, ty: number,
  scale: number,
  color: string,
) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2 * scale) return;
  const angle = Math.atan2(dy, dx);
  const headLen = 6 * scale;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - headLen * Math.cos(angle - 0.4), ty - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(tx - headLen * Math.cos(angle + 0.4), ty - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

export function AnimatedSkeleton({
  guide,
  width,
  height,
  className,
  ghost,
  showControls = false,
  canvasRefExternal,
}: AnimatedSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node;
      if (canvasRefExternal) {
        (canvasRefExternal as { current: HTMLCanvasElement | null }).current = node;
      }
    },
    [canvasRefExternal],
  );
  const animRef = useRef<number>(0);
  const stateRef = useRef({ frameIdx: 0, elapsed: 0, lastTime: 0 });
  const trailRef = useRef<PoseFrame | null>(null);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);

  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      pausedRef.current = !p;
      if (p) {
        stateRef.current.lastTime = 0;
        animRef.current = requestAnimationFrame(draw);
      }
      return !p;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => {
      const next = (i + 1) % SPEEDS.length;
      speedRef.current = SPEEDS[next];
      return next;
    });
  }, []);

  const draw = useCallback(
    (now: number) => {
      if (pausedRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const s = stateRef.current;
      if (s.lastTime === 0) s.lastTime = now;
      const dt = (now - s.lastTime) * speedRef.current;
      s.lastTime = now;
      s.elapsed += dt;

      const { keyframes, frameDurations, connections, highlightJoints } = guide;
      const dur = frameDurations[s.frameIdx] || 600;

      if (s.elapsed >= dur) {
        s.elapsed = 0;
        trailRef.current = keyframes[s.frameIdx];
        s.frameIdx = (s.frameIdx + 1) % keyframes.length;
      }

      const t = easeInOut(Math.min(s.elapsed / dur, 1));
      const nextIdx = (s.frameIdx + 1) % keyframes.length;
      const isLast = s.frameIdx === keyframes.length - 1;
      const pose = lerpFrame(keyframes[s.frameIdx], keyframes[isLast ? s.frameIdx : nextIdx], isLast ? 0 : t);

      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sx = cw / VB_W;
      const sy = ch / VB_H;
      const scale = Math.min(sx, sy);
      const ox = (cw - VB_W * scale) / 2;
      const oy = (ch - VB_H * scale) / 2;

      const toCanvas = (p: { x: number; y: number }) => ({
        x: ox + p.x * scale,
        y: oy + p.y * scale,
      });

      ctx.clearRect(0, 0, cw, ch);

      // grid
      if (!ghost) {
        ctx.strokeStyle = "rgba(255,255,255,0.025)";
        ctx.lineWidth = 1;
        const step = 30 * scale;
        for (let gx = ox % step; gx < cw; gx += step) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke();
        }
        for (let gy = oy % step; gy < ch; gy += step) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke();
        }
      }

      const baseAlpha = ghost ? 0.35 : 1;
      const limbColor = ghost ? `rgba(6,182,212,${baseAlpha * 0.7})` : "rgba(6,182,212,0.9)";
      const jointColor = ghost ? `rgba(6,182,212,${baseAlpha})` : "#06b6d4";
      const highlightColor = ghost ? `rgba(59,130,246,${baseAlpha})` : "#3b82f6";
      const glowColor = ghost ? "rgba(6,182,212,0.1)" : "rgba(6,182,212,0.25)";
      const arrowColor = "rgba(168,85,247,0.55)";

      // trail
      if (trailRef.current && !ghost) {
        ctx.globalAlpha = 0.12;
        for (const [from, to] of connections) {
          const a = trailRef.current[from];
          const b = trailRef.current[to];
          if (!a || !b) continue;
          const pa = toCanvas(a); const pb = toCanvas(b);
          ctx.strokeStyle = limbColor; ctx.lineWidth = 3 * scale; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // direction arrows for highlighted joints
      if (!ghost && !isLast) {
        const nextFrame = keyframes[nextIdx];
        const currFrame = keyframes[s.frameIdx];
        ctx.globalAlpha = 0.6;
        for (const jname of highlightJoints) {
          const curr = currFrame[jname];
          const nxt = nextFrame[jname];
          if (!curr || !nxt) continue;
          const dx = nxt.x - curr.x;
          const dy = nxt.y - curr.y;
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) continue;
          const pc = toCanvas(curr);
          const pt = toCanvas(nxt);
          drawArrow(ctx, pc.x, pc.y, pt.x, pt.y, scale, arrowColor);
        }
        ctx.globalAlpha = 1;
      }

      // limb glow
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18 * scale;
      for (const [from, to] of connections) {
        const a = pose[from]; const b = pose[to];
        if (!a || !b) continue;
        const pa = toCanvas(a); const pb = toCanvas(b);
        ctx.strokeStyle = limbColor; ctx.lineWidth = 4 * scale; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
      ctx.restore();

      // limb solid
      for (const [from, to] of connections) {
        const a = pose[from]; const b = pose[to];
        if (!a || !b) continue;
        const pa = toCanvas(a); const pb = toCanvas(b);
        ctx.strokeStyle = limbColor; ctx.lineWidth = 3 * scale; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }

      // joints
      for (const [name, joint] of Object.entries(pose)) {
        const p = toCanvas(joint);
        const isHighlight = highlightJoints.includes(name);
        const r = (isHighlight ? 6 : 4) * scale;
        const color = isHighlight ? highlightColor : jointColor;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = (isHighlight ? 14 : 8) * scale;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = ghost ? `rgba(255,255,255,${baseAlpha * 0.5})` : "rgba(255,255,255,0.6)";
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2); ctx.fill();

        if (isHighlight && !ghost) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 400);
          ctx.strokeStyle = `rgba(59,130,246,${0.15 + 0.2 * pulse})`;
          ctx.lineWidth = 1.5 * scale;
          ctx.beginPath(); ctx.arc(p.x, p.y, r * (1.4 + 0.3 * pulse), 0, Math.PI * 2); ctx.stroke();
        }
      }

      // head circle
      if (pose.head) {
        const h = toCanvas(pose.head);
        const headR = 10 * scale;
        ctx.strokeStyle = limbColor; ctx.lineWidth = 3 * scale;
        ctx.save(); ctx.shadowColor = glowColor; ctx.shadowBlur = 12 * scale;
        ctx.beginPath(); ctx.arc(h.x, h.y - headR * 0.3, headR, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }

      // step label
      if (!ghost) {
        const stepLabel = guide.steps[Math.min(s.frameIdx, guide.steps.length - 1)]?.title;
        if (stepLabel) {
          ctx.font = `bold ${11 * scale}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(161,161,170,0.7)";
          ctx.fillText(stepLabel, cw / 2, ch - 8 * scale);
        }
      }

      // frame indicator dots
      if (!ghost) {
        const dotR = 2.5 * scale;
        const dotGap = 10 * scale;
        const totalW = (guide.keyframes.length - 1) * dotGap;
        const dotStartX = cw / 2 - totalW / 2;
        const dotY = 10 * scale;
        for (let i = 0; i < guide.keyframes.length; i++) {
          ctx.fillStyle = i === s.frameIdx ? "rgba(6,182,212,0.9)" : "rgba(255,255,255,0.15)";
          ctx.beginPath(); ctx.arc(dotStartX + i * dotGap, dotY, dotR, 0, Math.PI * 2); ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    },
    [guide],
  );

  useEffect(() => {
    stateRef.current = { frameIdx: 0, elapsed: 0, lastTime: 0 };
    trailRef.current = null;
    pausedRef.current = false;
    speedRef.current = SPEEDS[1];
    setPaused(false);
    setSpeedIdx(1);
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div className="relative" style={{ width: width ?? "100%", height: height ?? "100%" }}>
      <canvas
        ref={setCanvasRef}
        className={className}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      {showControls && !ghost && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            onClick={cycleSpeed}
            className={cn(
              "flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.08] px-2 py-1 text-[10px] font-bold tabular-nums transition-colors hover:bg-black/80",
              speedIdx !== 1 ? "text-purple-300 border-purple-500/20" : "text-zinc-400"
            )}
          >
            <Gauge className="h-3 w-3" />
            {SPEEDS[speedIdx]}x
          </button>
          <button
            onClick={togglePause}
            className="flex items-center justify-center h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.08] text-zinc-400 transition-colors hover:text-white hover:bg-black/80"
          >
            {paused ? <Play className="h-3 w-3 ml-0.5" /> : <Pause className="h-3 w-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
