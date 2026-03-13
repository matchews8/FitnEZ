-- ============================================================
-- FitnEZ — Supabase Database Schema
-- ============================================================
-- Paste this entire file into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. EXERCISES TABLE
-- Stores each user's personal exercise library.
create table if not exists exercises (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  muscle_group text,
  notes        text,
  created_at   timestamptz default now() not null
);

-- 2. WORKOUTS TABLE
-- Stores each completed workout session.
create table if not exists workouts (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  notes        text,
  completed_at timestamptz default now() not null,
  created_at   timestamptz default now() not null
);

-- 3. WORKOUT_EXERCISES TABLE
-- Links a workout to the exercises performed in it (in order).
create table if not exists workout_exercises (
  id          uuid default gen_random_uuid() primary key,
  workout_id  uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  order_index integer not null default 0
);

-- 4. SETS TABLE
-- Stores individual sets (reps + weight) for each exercise in a workout.
create table if not exists sets (
  id                   uuid default gen_random_uuid() primary key,
  workout_exercise_id  uuid references workout_exercises(id) on delete cascade not null,
  reps                 integer,
  weight               numeric(6, 2),
  created_at           timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- This ensures each user can ONLY see and edit their own data.
-- ============================================================

-- Enable RLS on all tables
alter table exercises         enable row level security;
alter table workouts          enable row level security;
alter table workout_exercises enable row level security;
alter table sets              enable row level security;

-- EXERCISES: users can only access their own rows
create policy "Users can manage their own exercises"
  on exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- WORKOUTS: users can only access their own rows
create policy "Users can manage their own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- WORKOUT_EXERCISES: accessible if the linked workout belongs to the user
create policy "Users can manage workout exercises for their workouts"
  on workout_exercises for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_exercises.workout_id
        and workouts.user_id = auth.uid()
    )
  );

-- SETS: accessible if the linked workout_exercise belongs to the user
create policy "Users can manage sets for their workout exercises"
  on sets for all
  using (
    exists (
      select 1 from workout_exercises
      join workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
        and workouts.user_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES (speeds up common queries)
-- ============================================================
create index if not exists exercises_user_id_idx         on exercises(user_id);
create index if not exists workouts_user_id_idx          on workouts(user_id);
create index if not exists workout_exercises_workout_idx on workout_exercises(workout_id);
create index if not exists sets_workout_exercise_idx     on sets(workout_exercise_id);
