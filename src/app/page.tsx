"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Eye,
  BarChart3,
  Flame,
  Trophy,
  Volume2,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";

const features = [
  {
    icon: Eye,
    title: "Real-Time Pose Tracking",
    description:
      "MediaPipe-powered joint detection with color-coded skeleton overlay showing form quality at every joint.",
  },
  {
    icon: Target,
    title: "Form Scoring",
    description:
      "Get scored out of 100 on every rep based on depth, alignment, posture, and consistency.",
  },
  {
    icon: Sparkles,
    title: "Live Coaching Cues",
    description:
      'Instant corrective feedback like "Go lower", "Keep your back straight", and "Don\'t let knees cave in".',
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Track workout history, score trends, rep counts, and calorie burn with interactive charts.",
  },
  {
    icon: Flame,
    title: "Food & Calorie Tracking",
    description:
      "Log meals and snacks to track your daily calorie intake with personalized goals based on your profile.",
  },
  {
    icon: Trophy,
    title: "Workout Streaks",
    description:
      "Build consistency with streak tracking. Stay motivated with your current and best streak stats.",
  },
  {
    icon: Volume2,
    title: "Voice Coach",
    description:
      "Optional voice feedback using browser speech synthesis. Hear coaching cues hands-free.",
  },
  {
    icon: Zap,
    title: "Multiple Exercises",
    description:
      "Choose from built-in AI-tracked exercises or add your own. Customize weight, reps, and sets for each.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] gradient-mesh has-bottom-nav md:pb-0">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-12 md:pt-20 md:pb-24 lg:pt-32 lg:pb-36">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.h1
              variants={fadeInUp}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl"
            >
              Your AI-Powered
              <br />
              <span className="text-primary glow-text">Form Coach</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-4 md:mt-6 text-sm md:text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto leading-relaxed px-2"
            >
              Lift IQ uses your camera to track body joints in real time, analyze
              exercise form, score every rep out of 100, and deliver instant
              corrective feedback — like having a personal trainer in your pocket.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-6 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button size="xl" asChild className="group w-full sm:w-auto">
                <Link href="/workout">
                  Start Training
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero visual — webcam mockup */}
          <motion.div
            className="mx-auto mt-10 md:mt-20 max-w-4xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="glass-card glow-green rounded-2xl p-1">
              <div className="relative aspect-[4/3] md:aspect-video rounded-xl bg-black/80 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5" />
                <div className="relative text-center p-4 md:p-8">
                  <div className="flex justify-center mb-4 md:mb-6">
                    <svg
                      viewBox="0 0 200 300"
                      className="w-20 h-28 md:w-32 md:h-48 text-primary"
                    >
                      <circle cx="100" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
                      <line x1="100" y1="60" x2="100" y2="160" stroke="currentColor" strokeWidth="3" />
                      <line x1="100" y1="90" x2="50" y2="130" stroke="currentColor" strokeWidth="3" />
                      <line x1="100" y1="90" x2="150" y2="130" stroke="currentColor" strokeWidth="3" />
                      <line x1="100" y1="160" x2="60" y2="240" stroke="currentColor" strokeWidth="3" />
                      <line x1="100" y1="160" x2="140" y2="240" stroke="currentColor" strokeWidth="3" />
                      <circle cx="100" cy="90" r="6" fill="#00e68a" />
                      <circle cx="50" cy="130" r="6" fill="#00e68a" />
                      <circle cx="150" cy="130" r="6" fill="#00e68a" />
                      <circle cx="100" cy="160" r="6" fill="#facc15" />
                      <circle cx="60" cy="240" r="6" fill="#00e68a" />
                      <circle cx="140" cy="240" r="6" fill="#f87171" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400" />
                      <span className="text-muted-foreground">Good</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400" />
                      <span className="text-muted-foreground">Moderate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400" />
                      <span className="text-muted-foreground">Needs Fix</span>
                    </div>
                  </div>
                </div>

                <div className="absolute top-2 left-2 md:top-4 md:left-4 glass-card rounded-lg px-2 py-1 md:px-3 md:py-2">
                  <div className="text-[10px] md:text-xs text-muted-foreground">Score</div>
                  <div className="text-lg md:text-2xl font-bold text-primary">87</div>
                </div>
                <div className="absolute top-2 right-2 md:top-4 md:right-4 glass-card rounded-lg px-2 py-1 md:px-3 md:py-2">
                  <div className="text-[10px] md:text-xs text-muted-foreground">Reps</div>
                  <div className="text-lg md:text-2xl font-bold">12</div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 glass-card rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-center">
                  <span className="text-xs md:text-sm text-yellow-400">&uarr; Keep your chest up</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 md:py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            className="text-center mb-8 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              Everything You Need to
              <span className="text-primary"> Train Smarter</span>
            </h2>
            <p className="mt-3 md:mt-4 text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto px-2">
              Lift IQ combines real-time computer vision with smart exercise
              analysis to give you actionable coaching feedback.
            </p>
          </motion.div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full bg-card/50 hover:bg-card/80 transition-colors border-border/50 hover:border-primary/20 active:bg-card/80">
                  <CardContent className="pt-5 pb-5 md:pt-6">
                    <div className="mb-3 md:mb-4 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5 md:mb-2 text-sm md:text-base">{feature.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24 border-t border-border/50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl mb-3 md:mb-4">
              Ready to Level Up Your Form?
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8 px-2">
              Just your browser and a camera. Sign up and start training.
            </p>
            <Button size="xl" asChild className="group w-full sm:w-auto">
              <Link href="/workout">
                Start Your First Workout
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 md:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            Lift<span className="text-primary">IQ</span>
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            AI Workout Form Coach
          </span>
        </div>
      </footer>
    </div>
  );
}
