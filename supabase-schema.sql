-- ============================================================
-- FitnEZ — Supabase Database Schema v2
-- ============================================================
-- Run this entire file in Supabase → SQL Editor → New Query → Run
-- It safely drops the v1 tables before recreating everything.
-- ============================================================

-- ── Drop v1 objects (safe even if they don't exist) ──────────
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists seed_exercises_for_new_user();
drop table    if exists sets              cascade;
drop table    if exists workout_exercises cascade;
drop table    if exists workouts          cascade;
drop table    if exists exercises         cascade;

-- ── 1. EXERCISES (Exercise Reserve) ──────────────────────────
create table exercises (
  id        uuid default gen_random_uuid() primary key,
  user_id   uuid references auth.users(id) on delete cascade not null,
  name      text not null,
  body_part text not null check (body_part in ('Chest','Back','Shoulders','Arms','Legs','Core')),
  created_at timestamptz default now() not null
);

-- ── 2. WORKOUTS ───────────────────────────────────────────────
create table workouts (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  completed_at timestamptz,  -- null while active, set when finished
  created_at   timestamptz default now() not null
);

-- ── 3. WORKOUT_EXERCISES ──────────────────────────────────────
-- Records which exercises were selected for a given workout.
create table workout_exercises (
  id          uuid default gen_random_uuid() primary key,
  workout_id  uuid references workouts(id)  on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null
);

-- ── 4. SETS ────────────────────────────────────────────────────
-- Logs individual sets (reps + weight) for each workout exercise.
create table sets (
  id                  uuid default gen_random_uuid() primary key,
  workout_exercise_id uuid references workout_exercises(id) on delete cascade not null,
  set_number          int not null,
  reps                int,
  weight              numeric,
  created_at          timestamptz default now() not null
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table exercises         enable row level security;
alter table workouts          enable row level security;
alter table workout_exercises enable row level security;
alter table sets              enable row level security;

create policy "Users manage their own exercises"
  on exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage workout exercises for their workouts"
  on workout_exercises for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_exercises.workout_id
        and workouts.user_id = auth.uid()
    )
  );

create policy "Users manage sets for their workout exercises"
  on sets for all
  using (
    exists (
      select 1 from workout_exercises
      join workouts on workouts.id = workout_exercises.workout_id
      where workout_exercises.id = sets.workout_exercise_id
        and workouts.user_id = auth.uid()
    )
  );

-- ── INDEXES ───────────────────────────────────────────────────
create index if not exists exercises_user_id_idx         on exercises(user_id);
create index if not exists exercises_body_part_idx       on exercises(body_part);
create index if not exists workouts_user_id_idx          on workouts(user_id);
create index if not exists workout_exercises_workout_idx on workout_exercises(workout_id);
create index if not exists sets_workout_exercise_idx     on sets(workout_exercise_id);

-- ── SEED FUNCTION ─────────────────────────────────────────────
-- Runs automatically whenever a new user signs up.
create or replace function seed_exercises_for_new_user()
returns trigger as $$
begin
  insert into public.exercises (user_id, name, body_part) values
    (new.id, 'Bench Press',         'Chest'),
    (new.id, 'Incline Bench Press', 'Chest'),
    (new.id, 'Dips',                'Chest'),
    (new.id, 'Cable Flyes',         'Chest'),
    (new.id, 'Push Ups',            'Chest'),
    (new.id, 'Deadlift',            'Back'),
    (new.id, 'Pull Ups',            'Back'),
    (new.id, 'Bent Over Row',       'Back'),
    (new.id, 'Lat Pulldown',        'Back'),
    (new.id, 'Seated Cable Row',    'Back'),
    (new.id, 'Overhead Press',      'Shoulders'),
    (new.id, 'Lateral Raises',      'Shoulders'),
    (new.id, 'Front Raises',        'Shoulders'),
    (new.id, 'Face Pulls',          'Shoulders'),
    (new.id, 'Arnold Press',        'Shoulders'),
    (new.id, 'Barbell Curl',        'Arms'),
    (new.id, 'Hammer Curl',         'Arms'),
    (new.id, 'Tricep Pushdown',     'Arms'),
    (new.id, 'Skull Crushers',      'Arms'),
    (new.id, 'Dips',                'Arms'),
    (new.id, 'Squat',               'Legs'),
    (new.id, 'Romanian Deadlift',   'Legs'),
    (new.id, 'Leg Press',           'Legs'),
    (new.id, 'Hamstring Curl',      'Legs'),
    (new.id, 'Leg Extension',       'Legs'),
    (new.id, 'Walking Lunges',      'Legs'),
    (new.id, 'Plank',               'Core'),
    (new.id, 'Hanging Leg Raises',  'Core'),
    (new.id, 'Cable Crunches',      'Core'),
    (new.id, 'Ab Wheel Rollout',    'Core');
  return new;
end;
$$ language plpgsql security definer;

-- ── TRIGGER ───────────────────────────────────────────────────
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure seed_exercises_for_new_user();

-- ── SEED EXISTING USERS ───────────────────────────────────────
-- Seeds any accounts that already existed before this schema was run.
-- Safe to run multiple times — only seeds users with 0 exercises.
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    if (select count(*) from public.exercises where user_id = u.id) = 0 then
      insert into public.exercises (user_id, name, body_part) values
        (u.id, 'Bench Press',         'Chest'),
        (u.id, 'Incline Bench Press', 'Chest'),
        (u.id, 'Dips',                'Chest'),
        (u.id, 'Cable Flyes',         'Chest'),
        (u.id, 'Push Ups',            'Chest'),
        (u.id, 'Deadlift',            'Back'),
        (u.id, 'Pull Ups',            'Back'),
        (u.id, 'Bent Over Row',       'Back'),
        (u.id, 'Lat Pulldown',        'Back'),
        (u.id, 'Seated Cable Row',    'Back'),
        (u.id, 'Overhead Press',      'Shoulders'),
        (u.id, 'Lateral Raises',      'Shoulders'),
        (u.id, 'Front Raises',        'Shoulders'),
        (u.id, 'Face Pulls',          'Shoulders'),
        (u.id, 'Arnold Press',        'Shoulders'),
        (u.id, 'Barbell Curl',        'Arms'),
        (u.id, 'Hammer Curl',         'Arms'),
        (u.id, 'Tricep Pushdown',     'Arms'),
        (u.id, 'Skull Crushers',      'Arms'),
        (u.id, 'Dips',                'Arms'),
        (u.id, 'Squat',               'Legs'),
        (u.id, 'Romanian Deadlift',   'Legs'),
        (u.id, 'Leg Press',           'Legs'),
        (u.id, 'Hamstring Curl',      'Legs'),
        (u.id, 'Leg Extension',       'Legs'),
        (u.id, 'Walking Lunges',      'Legs'),
        (u.id, 'Plank',               'Core'),
        (u.id, 'Hanging Leg Raises',  'Core'),
        (u.id, 'Cable Crunches',      'Core'),
        (u.id, 'Ab Wheel Rollout',    'Core');
    end if;
  end loop;
end;
$$;
