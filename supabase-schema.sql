-- ============================================================
-- LiftIQ Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  age integer not null default 0,
  weight numeric not null default 0,
  height integer not null default 0,
  gender text not null default 'male',
  activity_level text not null default 'moderate',
  disabilities text not null default '',
  weight_goal text not null default 'maintain',
  calorie_goal integer not null default 2000,
  use_recommended_calories boolean not null default true,
  has_completed_onboarding boolean not null default false,
  voice_enabled boolean not null default false,
  sensitivity text not null default 'medium',
  camera_facing text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Workout sessions table
create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  exercise text not null,
  exercise_name text,
  weight numeric,
  start_time bigint not null,
  end_time bigint,
  reps jsonb not null default '[]',
  total_score integer not null default 0,
  calories_burned numeric not null default 0,
  is_recorded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

create policy "Users can view own sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

-- 3. Food log table
create table if not exists public.food_log (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  calories integer not null default 0,
  date text not null,
  meal text,
  created_at timestamptz not null default now()
);

alter table public.food_log enable row level security;

create policy "Users can view own food log"
  on public.food_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own food log"
  on public.food_log for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own food log"
  on public.food_log for delete
  using (auth.uid() = user_id);

-- 4. User exercises table
create table if not exists public.user_exercises (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  tracking_id text not null default 'custom',
  weight numeric,
  target_reps integer,
  target_sets integer,
  notes text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_exercises enable row level security;

create policy "Users can view own exercises"
  on public.user_exercises for select
  using (auth.uid() = user_id);

create policy "Users can insert own exercises"
  on public.user_exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exercises"
  on public.user_exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete own exercises"
  on public.user_exercises for delete
  using (auth.uid() = user_id);

-- 5. Streak data table
create table if not exists public.streaks (
  user_id uuid references auth.users on delete cascade primary key,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_workout_date text not null default '',
  workout_dates jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "Users can view own streaks"
  on public.streaks for select
  using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on public.streaks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own streaks"
  on public.streaks for update
  using (auth.uid() = user_id);

-- Create indexes for common queries
create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_start_time on public.workout_sessions(start_time);
create index if not exists idx_food_log_user_id on public.food_log(user_id);
create index if not exists idx_food_log_date on public.food_log(date);
create index if not exists idx_user_exercises_user_id on public.user_exercises(user_id);
