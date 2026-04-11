# Lift IQ — AI Workout Form Coach

> **Built for Bitcamp 2026**

Real-time AI-powered workout form analysis that uses your webcam to track body joints, score every rep out of 100, and deliver instant corrective coaching — like having a personal trainer in your browser.

## Devpost Summary

**Lift IQ** is an AI workout form coach that runs entirely in the browser. Using MediaPipe's pose detection model, it tracks 33 body landmarks in real time through your webcam, analyzes exercise form using joint angle calculations, and provides live scoring and coaching cues. The app supports 10 exercises with deep rule-based analysis for squats, push-ups, and lunges. Joint nodes are color-coded (green/yellow/red) based on form quality, and a post-workout summary powered by an AI feedback engine provides personalized improvement suggestions. Built with Next.js 14+, TypeScript, Tailwind CSS, and Recharts.

## Features

- **Real-Time Pose Tracking** — MediaPipe-powered skeleton overlay with 33 landmark detection
- **Color-Coded Joint Nodes** — Green (good), yellow (moderate), red (poor) based on form quality
- **Form Scoring** — Every rep scored 0–100 based on depth, alignment, posture, and consistency
- **Live Coaching Cues** — Instant feedback like "Go lower", "Keep your back straight", "Don't let knees cave in"
- **10 Supported Exercises** — Squat, push-up, lunge, plank, sit-up, jumping jack, mountain climber, shoulder press, bicep curl, burpee
- **Rep Counter** — Automatic rep detection based on movement phase transitions
- **Post-Workout Summary** — Total reps, average score, best rep, common mistakes, score-per-rep chart, AI analysis
- **Progress Dashboard** — Score trends, reps per day, calories burned, daily averages with interactive Recharts
- **Workout Streaks** — Track consistency with up to 2 rest days allowed
- **Calorie Tracking** — Automatic estimation based on exercise type and rep count
- **Voice Coach** — Optional browser speech synthesis for hands-free coaching cues
- **AI Feedback Engine** — Pluggable module (Gemini-ready) that generates natural-language workout analysis
- **Dark Mode** — Premium fitness-tech aesthetic with glassy cards and glow effects
- **Fully Browser-Based** — No backend, no auth, no mobile app — just your browser and a webcam

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui patterns (Radix UI primitives) |
| Pose Detection | MediaPipe Tasks Vision (PoseLandmarker) |
| Charts | Recharts |
| State Management | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Persistence | Local Storage |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser with webcam support (Chrome recommended)
- Webcam access

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd LiftIQ

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── workout/page.tsx    # Main workout page
│   ├── dashboard/page.tsx  # Analytics dashboard
│   └── settings/page.tsx   # Settings & help
├── components/
│   ├── layout/             # Navbar
│   ├── ui/                 # Reusable UI components (Button, Card, Badge, Progress)
│   └── workout/            # Workout-specific components
│       ├── webcam-feed.tsx
│       ├── exercise-selector.tsx
│       ├── workout-controls.tsx
│       ├── live-metrics.tsx
│       ├── coaching-cues.tsx
│       └── post-workout-summary.tsx
├── lib/
│   ├── ai/                 # AI feedback + voice coach
│   │   ├── feedback.ts     # Rule-based + Gemini-ready feedback
│   │   └── voice.ts        # Speech synthesis (ElevenLabs-ready)
│   ├── exercises/          # Exercise configs (10 exercises)
│   │   ├── squat.ts
│   │   ├── pushup.ts
│   │   ├── lunge.ts
│   │   ├── plank.ts
│   │   ├── situp.ts
│   │   ├── jumping-jack.ts
│   │   ├── mountain-climber.ts
│   │   ├── shoulder-press.ts
│   │   ├── bicep-curl.ts
│   │   ├── burpee.ts
│   │   └── index.ts        # Exercise registry
│   ├── pose/               # Pose detection
│   │   ├── angle-utils.ts  # Angle calculation, landmark constants
│   │   └── use-pose-detection.ts  # React hook for MediaPipe
│   ├── scoring/
│   │   └── rep-detector.ts # Rep counting + scoring engine
│   ├── storage/
│   │   └── index.ts        # Local storage persistence
│   ├── store.ts            # Zustand state management
│   └── utils.ts            # Tailwind merge utility
└── types/
    └── index.ts            # TypeScript type definitions
```

## Exercise Architecture

Each exercise implements the `ExerciseConfig` interface:

```typescript
interface ExerciseConfig {
  id: string;
  name: string;
  description: string;
  targetJoints: number[];        // Landmark indices to highlight
  phases: string[];               // Movement phases (e.g., "standing", "bottom")
  detectPhase: (...) => string;   // Determine current movement phase
  scoreRep: (...) => { score, issues };  // Score form quality
  getCoachingCues: (...) => string[];    // Generate coaching text
  caloriesPerRep: number;
}
```

## Scoring Logic

Scores are calculated based on:
- **Range of motion** — Joint angles compared to ideal ranges
- **Joint alignment** — Knee tracking, elbow flare, torso lean
- **Body posture** — Hip sag, chest position, weight balance
- **Symmetry** — Left/right consistency

Each issue detected maps to a joint status (good/moderate/poor) that drives the color-coded node visualization.

## License

MIT
