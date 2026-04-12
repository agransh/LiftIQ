# LiftIQ — AI Workout Form Coach

Real-time AI-powered workout form analysis that uses your camera to track body joints, score every rep out of 100, and deliver instant corrective coaching — like having a personal trainer in your browser.

## Features

### Real-Time Pose Detection & Scoring
- **MediaPipe Pose Landmarker** tracks 33 body landmarks in real time through your camera
- **Color-coded joint nodes** — green (good), yellow (moderate), red (poor) based on form quality
- **Every rep scored 0–100** based on depth, alignment, posture, and range of motion
- **Custom angle-cycle state machine** for accurate rep counting with ROM validation and hysteresis

### Live Coaching
- **Real-time coaching cues** — instant feedback like "Go lower", "Keep your back straight", "Don't let knees cave in"
- **Voice coach** — spoken cues via browser SpeechSynthesis for hands-free guidance
- **Form check gate** — verifies starting position before counting reps, with guidance to adjust camera distance
- **10-second countdown timer** before each workout begins

### 10 Supported Exercises
Squat, push-up, lunge, plank, sit-up, jumping jack, mountain climber, shoulder press, bicep curl, and burpee — each with deep rule-based form analysis.

### Exercise Guide System
- **Animated skeleton demonstrations** for all 10 exercises using canvas-based rendering
- **Step-by-step instructions**, common mistakes, coaching cues, and focus area highlights
- **Playback controls** — play/pause, speed adjustment, directional movement arrows
- **Ghost coach mode** — translucent ideal skeleton overlay on the live camera feed for side-by-side form comparison

### Performance Library
- **Record workouts** directly in the browser with automatic cloud sync
- **AI-powered post-session insights** using Google Gemini — explains form mistakes in plain English with actionable fix tips
- **Score timeline charts**, detected mistakes, and perfect rep highlights for every recorded session
- **Download and manage** recordings from the library

### Analytics Dashboard
- **Score trends**, reps per day, daily averages, and score distribution with interactive Recharts
- **Workout streaks** — tracks consistency with current and best streak
- **Perfect rep tracking** — all-time best rep, perfect rep count and rate
- **Common mistakes analysis** across all sessions

### Nutrition Tracking
- **USDA FoodData Central** integration for searching real food items
- **Daily calorie tracking** with goal-based progress (lose weight, maintain, gain)
- **Macro breakdown** — protein, carbs, fat per entry
- **Personalized calorie goals** calculated from profile (BMR/TDEE)

### User Accounts & Cloud Sync
- **Supabase authentication** with email/password sign-up and sign-in
- **Cloud storage** for workout sessions, food logs, streaks, recordings, and custom exercises
- **Per-user data isolation** — local cache is scoped by user ID, cleared on logout/switch
- **Multi-step onboarding** — profile setup with personalized calorie recommendations

### Additional
- **Camera controls** — front/back camera toggle, 0.5x/1x zoom for rear camera
- **Custom exercises** — create and manage your own exercises
- **Workout routines** — build named routines from exercise sequences
- **Mobile-responsive** — full mobile layout with bottom navigation and compact HUD
- **Premium dark UI** — glassmorphism cards, gradient accents, Framer Motion animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives, Lucide React icons |
| Pose Detection | MediaPipe Tasks Vision (PoseLandmarker) |
| AI Explanations | Google Gemini (gemini-2.0-flash) |
| Charts | Recharts |
| State Management | Zustand |
| Animations | Framer Motion |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Local Storage | localStorage + IndexedDB (recordings) |
| Nutrition API | USDA FoodData Central |
| Voice | Browser SpeechSynthesis API |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser with webcam support (Chrome recommended)
- A Supabase project (free tier works)

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
USDA_API_KEY=your_usda_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Supabase Setup

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create all required tables, RLS policies, storage buckets, and indexes.

### Installation

```bash
git clone https://github.com/agransh/LiftIQ.git
cd LiftIQ
npm install
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
├── app/
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Authentication (sign-in / sign-up)
│   ├── onboarding/page.tsx     # Multi-step profile setup
│   ├── workout/page.tsx        # Main workout studio
│   ├── dashboard/page.tsx      # Analytics dashboard
│   ├── recordings/page.tsx     # Performance library
│   ├── settings/page.tsx       # Profile & preferences
│   └── api/
│       └── food-search/route.ts  # USDA food search proxy
├── components/
│   ├── exercise-guide/         # Animated skeleton demos, ghost coach overlay
│   ├── layout/                 # Navbar
│   ├── nutrition/              # Food tracker with USDA search
│   ├── providers/              # App shell (user-scoped storage)
│   ├── ui/                     # Reusable UI primitives
│   └── workout/                # Webcam feed, controls, metrics, coaching, recording
├── lib/
│   ├── ai/                     # Gemini client, form explainer, voice manager
│   ├── exercises/              # 10 exercise configs + visual guide data
│   ├── pose/                   # MediaPipe hook, angle utilities
│   ├── scoring/                # Rep detector state machine
│   ├── storage/                # localStorage + IndexedDB + Supabase sync
│   ├── store.ts                # Zustand global state
│   ├── supabase-db.ts          # Supabase CRUD operations
│   └── calories.ts             # BMR/TDEE/calorie goal calculations
├── utils/supabase/             # Supabase client, server, middleware helpers
└── types/index.ts              # TypeScript type definitions
```

## Supabase Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User demographics, goals, calorie settings, onboarding status |
| `workout_sessions` | Exercise sessions with rep-level scoring data (JSONB) |
| `food_log` | Daily food entries with macros |
| `streaks` | Current/best workout streaks per user |
| `user_exercises` | Custom and preset exercise configurations |
| `workout_routines` | Named exercise sequences |
| `recordings` | Video recording metadata with Supabase Storage paths |

All tables use Row Level Security (RLS) scoped to `auth.uid()`. The `recordings` storage bucket restricts file access by user folder.

## License

MIT
