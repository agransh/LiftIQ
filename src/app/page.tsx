"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye, BarChart3, Flame, Trophy, Volume2, ArrowRight,
  Sparkles, Target, Zap, Camera, Crosshair, Repeat, Aperture, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";

const features = [
  { icon: Eye, title: "Real-Time Pose Tracking", desc: "33-point skeleton overlay tracks every joint in real time using your browser camera." },
  { icon: Target, title: "Form Scoring 0–100", desc: "Every rep earns a score based on depth, alignment, and tempo." },
  { icon: Sparkles, title: "AI Coaching Cues", desc: "Instant text and voice corrections when your form needs work." },
  { icon: BarChart3, title: "Progress Analytics", desc: "Track score trends, rep volume, and daily streaks over time." },
  { icon: Flame, title: "Calorie Tracking", desc: "Log meals and match nutrition with your workout output." },
  { icon: Repeat, title: "10+ Exercises", desc: "Squats, push-ups, curls, lunges, burpees, and more." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 has-bottom-nav md:pb-0">
      <Navbar />

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden">
        {/* Purple/pink gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-transparent blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-28 md:pb-32">
          {/* Bitcamp badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 text-sm text-purple-300">
              <Zap className="h-3.5 w-3.5" />
              Built for Bitcamp 2026
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]"
          >
            <span className="block">Your camera is</span>
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              your coach.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-center text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mt-6 leading-relaxed"
          >
            LiftIQ uses AI to analyze your exercise form in real time —
            scoring every rep, tracking every joint, coaching you to perfection.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Button size="xl" asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 rounded-2xl px-10 border-0">
              <Link href="/workout">
                <Play className="h-5 w-5 fill-current" />
                Start Training
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-2xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </motion.div>

          {/* ━━━ WEBCAM PREVIEW ━━━ */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 md:mt-24 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
              {/* Gradient top bar */}
              <div className="gradient-bar" />

              {/* Browser chrome */}
              <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/70" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <span className="h-3 w-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-zinc-500 ml-3 hidden sm:block">LiftIQ — Live Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">REC</span>
                </div>
              </div>

              {/* Feed area */}
              <div className="relative aspect-[2.2/1] bg-zinc-950">
                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "50px 50px",
                }} />

                {/* Stick figure */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 240 360" className="h-[55%] w-auto opacity-90" aria-hidden>
                    <defs>
                      <linearGradient id="bone-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <line x1="120" y1="60" x2="120" y2="180" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="120" y1="100" x2="65" y2="155" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="120" y1="100" x2="175" y2="155" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="65" y1="155" x2="45" y2="120" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="175" y1="155" x2="195" y2="120" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="120" y1="180" x2="80" y2="280" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="120" y1="180" x2="160" y2="280" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="80" y1="280" x2="70" y2="340" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <line x1="160" y1="280" x2="170" y2="340" stroke="url(#bone-grad)" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="120" cy="38" r="22" fill="none" stroke="url(#bone-grad)" strokeWidth="3" />
                    {/* Joints */}
                    <circle cx="120" cy="100" r="6" fill="#22c55e" />
                    <circle cx="65" cy="155" r="6" fill="#22c55e" />
                    <circle cx="175" cy="155" r="6" fill="#eab308" />
                    <circle cx="120" cy="180" r="6" fill="#22c55e" />
                    <circle cx="80" cy="280" r="6" fill="#22c55e" />
                    <circle cx="160" cy="280" r="6" fill="#ef4444" />
                    <circle cx="45" cy="120" r="5" fill="#22c55e" />
                    <circle cx="195" cy="120" r="5" fill="#22c55e" />
                  </svg>
                </div>

                {/* Floating Score */}
                <motion.div
                  className="absolute top-4 left-4 sm:top-6 sm:left-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl px-4 py-3 shadow-xl">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Score</div>
                    <div className="text-3xl font-black tabular-nums text-green-400">94<span className="text-sm text-zinc-600 ml-0.5">/100</span></div>
                  </div>
                </motion.div>

                {/* Floating Reps */}
                <motion.div
                  className="absolute top-4 right-4 sm:top-6 sm:right-6"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl px-4 py-3 shadow-xl">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Reps</div>
                    <div className="text-3xl font-black tabular-nums text-purple-400">12</div>
                  </div>
                </motion.div>

                {/* Coaching cue */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                  <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 shadow-xl">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-zinc-300">Keep your chest up — great depth</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section className="border-t border-zinc-800 bg-zinc-950 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">train smarter</span>
            </h2>
            <p className="mt-4 text-zinc-500 text-lg max-w-lg mx-auto">
              Precision tracking, scoring, and coaching — all from your webcam.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-800">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-950 p-8 hover:bg-zinc-900/50 transition-colors duration-300"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-purple-400" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-16">
            Three steps to <span className="text-purple-400">perfect form</span>
          </h2>

          <div className="space-y-0">
            {[
              { icon: Camera, num: "01", title: "Set up camera", desc: "Grant browser access and frame your full body. No app to install." },
              { icon: Crosshair, num: "02", title: "Choose exercise", desc: "Pick from 10+ movements — the model locks onto your joints in seconds." },
              { icon: Zap, num: "03", title: "Train with AI", desc: "Watch your score, reps, and cues update live as you move." },
            ].map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start py-8 border-b border-zinc-800 last:border-0"
              >
                <div className="shrink-0 h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-purple-400" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-400/60 tracking-widest mb-1">{s.num}</div>
                  <h3 className="text-xl font-bold mb-1">{s.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-zinc-800 py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/50 px-8 py-16 md:px-14 md:py-20 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-gradient-to-br from-purple-600/15 via-pink-500/10 to-transparent blur-[80px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Ready to train smarter?
              </h2>
              <p className="text-zinc-500 text-lg mb-8 max-w-md mx-auto">
                Open LiftIQ, press start, and let your reps speak.
              </p>
              <Button size="xl" asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25 rounded-2xl px-10 border-0">
                <Link href="/workout">
                  Start Training
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <Aperture className="h-5 w-5 text-purple-400" strokeWidth={1.75} />
            <span className="font-bold">Lift<span className="text-purple-400">IQ</span></span>
          </div>
          <span className="hidden md:block text-zinc-700">·</span>
          <span className="text-sm text-zinc-600">AI Form Coach</span>
          <span className="hidden md:block text-zinc-700">·</span>
          <span className="text-xs text-zinc-700">Built for Bitcamp 2026</span>
        </div>
      </footer>
    </div>
  );
}
