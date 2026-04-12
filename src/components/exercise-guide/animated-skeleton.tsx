"use client";

import { useRef, useEffect, useCallback } from "react";
import type { PoseFrame, ExerciseVisualGuide } from "@/lib/exercises/exercise-visual-guides";

interface AnimatedSkeletonProps {
  guide: ExerciseVisualGuide;
  width?: number;
  height?: number;
  className?: string;
  /** when true, renders a translucent cyan ghost (for overlay mode) */
  ghost?: boolean;
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

export function AnimatedSkeleton({ guide, width, height, className, ghost }: AnimatedSkeletonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ frameIdx: 0, elapsed: 0, lastTime: 0 });

  const trailRef = useRef<PoseFrame | null>(null);

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const s = stateRef.current;
      if (s.lastTime === 0) s.lastTime = now;
      const dt = now - s.lastTime;
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
      const next = (s.frameIdx + 1) % keyframes.length;
      const pose = lerpFrame(keyframes[s.frameIdx], keyframes[next === 0 ? s.frameIdx : next], s.frameIdx === keyframes.length - 1 ? 0 : t);

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
        for (let x = ox % step; x < cw; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, ch);
          ctx.stroke();
        }
        for (let y = oy % step; y < ch; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(cw, y);
          ctx.stroke();
        }
      }

      const baseAlpha = ghost ? 0.35 : 1;
      const limbColor = ghost ? `rgba(6,182,212,${baseAlpha * 0.7})` : "rgba(6,182,212,0.9)";
      const jointColor = ghost ? `rgba(6,182,212,${baseAlpha})` : "#06b6d4";
      const highlightColor = ghost ? `rgba(59,130,246,${baseAlpha})` : "#3b82f6";
      const glowColor = ghost ? "rgba(6,182,212,0.1)" : "rgba(6,182,212,0.25)";

      // trail (previous frame ghost)
      if (trailRef.current && !ghost) {
        ctx.globalAlpha = 0.12;
        for (const [from, to] of connections) {
          const a = trailRef.current[from];
          const b = trailRef.current[to];
          if (!a || !b) continue;
          const pa = toCanvas(a);
          const pb = toCanvas(b);
          ctx.strokeStyle = limbColor;
          ctx.lineWidth = 3 * scale;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // limb glow
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 18 * scale;
      for (const [from, to] of connections) {
        const a = pose[from];
        const b = pose[to];
        if (!a || !b) continue;
        const pa = toCanvas(a);
        const pb = toCanvas(b);
        ctx.strokeStyle = limbColor;
        ctx.lineWidth = 4 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      ctx.restore();

      // limb solid
      for (const [from, to] of connections) {
        const a = pose[from];
        const b = pose[to];
        if (!a || !b) continue;
        const pa = toCanvas(a);
        const pb = toCanvas(b);
        ctx.strokeStyle = limbColor;
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // joints
      for (const [name, joint] of Object.entries(pose)) {
        const p = toCanvas(joint);
        const isHighlight = highlightJoints.includes(name);
        const r = (isHighlight ? 6 : 4) * scale;
        const color = isHighlight ? highlightColor : jointColor;

        // glow
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = (isHighlight ? 14 : 8) * scale;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // bright center
        ctx.fillStyle = ghost ? `rgba(255,255,255,${baseAlpha * 0.5})` : "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // highlight ring pulse
        if (isHighlight && !ghost) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 400);
          ctx.strokeStyle = `rgba(59,130,246,${0.15 + 0.2 * pulse})`;
          ctx.lineWidth = 1.5 * scale;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * (1.4 + 0.3 * pulse), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // head circle
      if (pose.head) {
        const h = toCanvas(pose.head);
        const headR = 10 * scale;
        ctx.strokeStyle = limbColor;
        ctx.lineWidth = 3 * scale;
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12 * scale;
        ctx.beginPath();
        ctx.arc(h.x, h.y - headR * 0.3, headR, 0, Math.PI * 2);
        ctx.stroke();
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

      animRef.current = requestAnimationFrame(draw);
    },
    [guide],
  );

  useEffect(() => {
    stateRef.current = { frameIdx: 0, elapsed: 0, lastTime: 0 };
    trailRef.current = null;
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        display: "block",
      }}
    />
  );
}
