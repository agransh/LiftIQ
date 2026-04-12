# Lift IQ — AI Workout Form Coach

> **Built for Bitcamp 2026**

| | |
|--|--|
| **Live app** | [lift-iq-eta.vercel.app](https://lift-iq-eta.vercel.app) |
| **Source** | [github.com/agransh/LiftIQ](https://github.com/agransh/LiftIQ) |

Real-time AI-powered workout form analysis that uses your webcam to track body joints, score every rep out of 100, and deliver instant corrective coaching — like having a personal trainer in your browser.

## Devpost Summary

**Lift IQ** is an AI workout form coach that runs primarily in the browser. Using MediaPipe’s pose detection model, it tracks 33 body landmarks in real time through your webcam, analyzes exercise form with joint-angle rules, and provides live scoring and coaching cues. The app supports 10+ exercises with deeper analysis for squats, push-ups, and lunges. Joint nodes are color-coded (green / yellow / red) based on form quality, and a post-workout summary powered by an AI feedback engine suggests improvements. Built with **Next.js** (App Router), **TypeScript**, **Tailwind CSS**, and **Recharts**.

## Features

- **Real-Time Pose Tracking** — MediaPipe skeleton overlay with 33 landmark detection
- **Color-Coded Joint Nodes** — Green (good), yellow (moderate), red (poor) based on form quality
- **Form Scoring** — Every rep scored 0–100 based on depth, alignment, and consistency
- **Live Coaching Cues** — Instant feedback (e.g. “Go lower”, “Keep your back straight”, “Don’t let knees cave in”)
- **10+ Supported Exercises** — Squat, push-up, lunge, plank, sit-up, jumping jack, mountain climber, shoulder press, bicep curl, burpee, and more
- **Rep Counter** — Phase-based rep detection with configurable exercise rules
- **Post-Workout Summary** — Total reps, average score, best rep, common issues, score-per-rep chart, AI-style analysis
- **Progress Dashboard** — Score trends, reps per day, calories, daily averages (Recharts)
- **Workout Streaks** — Consistency tracking with rest-day allowance
- **Calorie Tracking** — Estimates from exercise type and rep volume
- **Nutrition** — Food logging to complement training output
- **Voice Coach** — Optional browser speech synthesis for hands-free cues
- **AI Feedback Engine** — Pluggable module (Gemini-ready) for natural-language workout analysis
- **Dark, glassy UI** — Fitness-tech aesthetic
- **Accounts (optional)** — Sign in via Supabase for synced sessions; core pose and workout logic runs client-side

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui patterns (Radix UI primitives) |
| Pose | MediaPipe Tasks Vision (PoseLandmarker) |
| Charts | Recharts |
| State | Zustand |
| Motion | Framer Motion |
| Icons | Lucide React |
| Backend / auth | Supabase (optional account & data sync) |
| Local data | `localStorage`, IndexedDB (e.g. recordings) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser with webcam support (Chrome recommended)
- Webcam permission

### Installation

```bash
git clone https://github.com/agransh/LiftIQ.git
cd LiftIQ
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For production-like runs locally:

```bash
npm run build
npm start
```

Deploys cleanly to Vercel; production URL: **[https://lift-iq-eta.vercel.app](https://lift-iq-eta.vercel.app)**.

## Project Structure (overview)

```
src/
├── app/                         # App Router pages & API routes
│   ├── page.tsx                 # Landing
│   ├── login/                   # Auth
│   ├── auth/callback/           # OAuth callback
│   ├── onboarding/
│   ├── workout/
│   ├── dashboard/
│   ├── recordings/
│   ├── settings/
│   └── test/pushup/             # Dev shortcut → workout?exercise=pushup
├── components/
│   ├── layout/                  # Navbar, app shell
│   ├── ui/                      # Buttons, cards, glass surfaces
│   ├── workout/                 # Webcam, controls, metrics, routines
│   └── nutrition/               # Food tracker
├── lib/
│   ├── ai/                      # Feedback + voice coach
│   ├── exercises/               # Per-exercise configs & scoring
│   ├── pose/                    # MediaPipe hook, angles
│   ├── scoring/                 # Rep detector
│   ├── storage/                 # Local persistence helpers
│   ├── supabase-db.ts
│   ├── store.ts
│   └── utils.ts
├── utils/supabase/              # Browser & server Supabase clients
├── middleware.ts
└── types/
```

## Exercise Architecture

Each exercise implements the `ExerciseConfig` interface:

```typescript
interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  targetJoints: number[];        // Landmark indices to highlight
  phases: string[];              // Movement phases (e.g. "standing", "bottom")
  detectPhase: (...) => string;  // Current phase from joint angles
  scoreRep: (...) => { score, issues };
  getCoachingCues: (...) => string[];
  caloriesPerRep: number;
}
```

## Scoring Logic

Scores reflect:

- **Range of motion** — Joint angles vs. ideal ranges
- **Joint alignment** — Knee tracking, elbow flare, torso lean
- **Body posture** — Hip sag, chest position, weight balance
- **Symmetry** — Left / right consistency

Each issue maps to a joint status (good / moderate / poor) for the color-coded overlay.

## License

MIT
