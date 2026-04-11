"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye, BarChart3, Flame, ArrowRight, ArrowUpRight,
  Sparkles, Target, Zap, Camera, Crosshair, Repeat, Activity,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const features = [
  { icon: Eye, title: "33-Point Skeleton", desc: "Full-body joint tracking overlaid on your camera feed in real time." },
  { icon: Target, title: "Rep Scoring 0–100", desc: "Every rep earns a precision score based on depth, alignment, and tempo." },
  { icon: Sparkles, title: "Live AI Coaching", desc: "Instant corrections when your form breaks down, spoken or on-screen." },
  { icon: BarChart3, title: "Progress Intelligence", desc: "Score trends, rep volume, daily streaks — all tracked automatically." },
  { icon: Flame, title: "Nutrition Tracking", desc: "Log meals and balance your calorie intake with training output." },
  { icon: Repeat, title: "10+ Exercises", desc: "Squats, push-ups, curls, lunges, burpees, and more — AI-tracked." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen has-bottom-nav md:pb-0">
      <Navbar />

      {/* ━━━━━ HERO ━━━━━ */}
      <section className="relative overflow-hidden">
        {/* Decorative grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-32 md:pb-36 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0}
              >
                <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs font-semibold tracking-wide text-cyan-300 mb-8">
                  <Zap className="h-3 w-3" />
                  Built for Bitcamp 2026
                </div>
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="text-[2.75rem] sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[1.05]"
              >
                Your camera
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent animate-gradient">
                  is your coach
                </span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="mt-6 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg"
              >
                LiftIQ uses AI to score every rep, track every joint, and coach you to perfect form — all from your browser.
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/workout"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 px-8 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.98]"
                >
                  Start Training
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl glass-card px-6 py-4 text-sm font-semibold text-zinc-300 transition-all hover:bg-white/[0.04]"
                >
                  View Dashboard
                  <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                </Link>
              </motion.div>
            </div>

            {/* Right: App preview mock */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative">
                {/* Glow behind */}
                <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10 blur-2xl" />

                <GlassCard elevated className="relative overflow-hidden rounded-3xl">
                  {/* Accent line */}
                  <div className="accent-line" />

                  {/* Browser chrome */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-600">LiftIQ — Live Session</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/80">REC</span>
                    </div>
                  </div>

                  {/* Feed area */}
                  <div className="relative aspect-[16/10] bg-[#040408]">
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
                      backgroundSize: "32px 32px",
                    }} />

                    {/* Skeleton figure */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 240 360" className="h-[60%] w-auto" aria-hidden>
                        <defs>
                          <linearGradient id="skel" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                        {/* Bones */}
                        {[[120,60,120,180],[120,100,65,155],[120,100,175,155],[65,155,45,120],[175,155,195,120],[120,180,80,280],[120,180,160,280],[80,280,70,340],[160,280,170,340]].map(([x1,y1,x2,y2], i) => (
                          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#skel)" strokeWidth="2.5" strokeLinecap="round" />
                        ))}
                        <circle cx="120" cy="38" r="20" fill="none" stroke="url(#skel)" strokeWidth="2.5" />
                        {/* Joints */}
                        {[[120,100,"#34d399"],[65,155,"#34d399"],[175,155,"#fbbf24"],[120,180,"#34d399"],[80,280,"#34d399"],[160,280,"#f43f5e"],[45,120,"#34d399"],[195,120,"#34d399"]].map(([cx, cy, fill], i) => (
                          <circle key={`j${i}`} cx={cx as number} cy={cy as number} r="5" fill={fill as string} className="drop-shadow-lg" />
                        ))}
                      </svg>
                    </div>

                    {/* Floating score */}
                    <motion.div
                      className="absolute top-5 left-5"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <GlassCard className="rounded-xl px-4 py-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Score</div>
                        <div className="text-3xl font-black tabular-nums text-emerald-400 mt-0.5">94</div>
                      </GlassCard>
                    </motion.div>

                    {/* Floating reps */}
                    <motion.div
                      className="absolute top-5 right-5"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                    >
                      <GlassCard className="rounded-xl px-4 py-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Reps</div>
                        <div className="text-3xl font-black tabular-nums text-cyan-400 mt-0.5">12</div>
                      </GlassCard>
                    </motion.div>

                    {/* Coaching cue */}
                    <div className="absolute bottom-5 inset-x-5">
                      <GlassCard className="rounded-xl px-4 py-2.5 flex items-center justify-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="text-[13px] text-zinc-300 font-medium">Keep your chest up — great depth</span>
                      </GlassCard>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━ FEATURES ━━━━━ */}
      <section className="relative py-24 md:py-32">
        <div className="accent-line" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em]">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">train smarter</span>
            </h2>
            <p className="mt-4 text-zinc-500 text-lg max-w-xl mx-auto">
              Precision tracking, real-time scoring, and intelligent coaching — all from your webcam.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <GlassCard className="h-full p-7 group hover:bg-white/[0.03] transition-all duration-500">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/10 transition-shadow group-hover:shadow-[0_0_20px_-4px_rgba(6,182,212,0.3)]">
                    <f.icon className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-zinc-100">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ HOW IT WORKS ━━━━━ */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-center mb-16">
            Three steps to{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">perfect form</span>
          </h2>

          {[
            { icon: Camera, num: "01", title: "Set up your camera", desc: "Grant browser access and frame your full body. No app install needed." },
            { icon: Crosshair, num: "02", title: "Choose an exercise", desc: "Pick from 10+ tracked movements — AI locks onto your joints instantly." },
            { icon: Activity, num: "03", title: "Train with AI", desc: "Score, reps, and coaching cues update live as you move." },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 py-8 border-b border-white/[0.04] last:border-0"
            >
              <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl glass-card">
                <step.icon className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/60 mb-1.5">{step.num}</div>
                <h3 className="text-xl font-bold mb-1 text-zinc-100">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ━━━━━ CTA ━━━━━ */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <GlassCard elevated glow className="relative overflow-hidden rounded-3xl px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-blue-500/[0.04]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.03em] mb-4">Ready to train smarter?</h2>
              <p className="text-zinc-500 text-lg mb-8 max-w-md mx-auto">Open LiftIQ, press start, and let your reps speak.</p>
              <Link
                href="/workout"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 px-8 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 hover:brightness-110"
              >
                Start Training
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ━━━━━ FOOTER ━━━━━ */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-blue-500">
              <Zap className="h-3 w-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">Lift<span className="text-cyan-400">IQ</span></span>
          </div>
          <span className="text-zinc-700 hidden md:block">·</span>
          <span className="text-xs text-zinc-600">AI Form Coach — Built for Bitcamp 2026</span>
          <span className="text-[10px] text-zinc-700 font-mono tabular-nums" title="Git commit this build was made from (Vercel)">
            · build {process.env.NEXT_PUBLIC_DEPLOY_SHA}
          </span>
        </div>
      </footer>
    </div>
  );
}
