-- ============================================================
-- FitnEZ — Supabase Database Schema v3
-- ============================================================
-- FRESH INSTALL: Run this entire file in Supabase → SQL Editor → New Query → Run
-- EXISTING v2 DATABASE: Run ONLY the migration section at the bottom of this file.
-- ============================================================

-- ── Drop v2 objects (safe even if they don't exist) ──────────
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists seed_exercises_for_new_user();
drop table    if exists sets              cascade;
drop table    if exists workout_exercises cascade;
drop table    if exists workouts          cascade;
drop table    if exists exercises         cascade;

-- ── 1. EXERCISES ─────────────────────────────────────────────
create table exercises (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  body_part  text not null check (body_part in ('Chest','Back','Shoulders','Arms','Legs','Core')),
  form_tips  text,
  created_at timestamptz default now() not null
);

-- ── 2. WORKOUTS ───────────────────────────────────────────────
create table workouts (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  completed_at timestamptz,
  created_at   timestamptz default now() not null
);

-- ── 3. WORKOUT_EXERCISES ──────────────────────────────────────
create table workout_exercises (
  id          uuid default gen_random_uuid() primary key,
  workout_id  uuid references workouts(id)  on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null
);

-- ── 4. SETS ────────────────────────────────────────────────────
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
  insert into public.exercises (user_id, name, body_part, form_tips) values
    (new.id, 'Bench Press',         'Chest',     'Retract your shoulder blades, plant your feet flat, lower the bar to your lower chest with a controlled 2-second descent, drive through your chest on the way up.'),
    (new.id, 'Incline Bench Press', 'Chest',     'Set the bench to 30-45 degrees, keep elbows at roughly 45 degrees from your torso, focus on squeezing the upper chest at the top.'),
    (new.id, 'Dips',                'Chest',     'Lean slightly forward to target chest, lower until shoulders are below elbows, avoid shrugging at the top.'),
    (new.id, 'Cable Flyes',         'Chest',     'Keep a slight bend in the elbows throughout, focus on squeezing the chest at the centre, control the return.'),
    (new.id, 'Push Ups',            'Chest',     'Keep your body in a straight line from head to heels, lower your chest to the floor, elbows at roughly 45 degrees.'),
    (new.id, 'Deadlift',            'Back',      'Hinge at the hips, neutral spine throughout, bar stays close to the body, drive through the floor and lock out hips and knees simultaneously.'),
    (new.id, 'Pull Ups',            'Back',      'Start from a dead hang, drive elbows down and back, chin clears the bar, lower with control.'),
    (new.id, 'Bent Over Row',       'Back',      'Hinge to roughly 45 degrees, retract the scapula before pulling, drive elbows back, squeeze at the top.'),
    (new.id, 'Lat Pulldown',        'Back',      'Slight lean back, pull the bar to your upper chest, focus on driving elbows down rather than pulling with hands.'),
    (new.id, 'Seated Cable Row',    'Back',      'Sit tall, retract shoulder blades first, pull to the lower abdomen, control the return without rounding the back.'),
    (new.id, 'Overhead Press',      'Shoulders', 'Brace your core, press the bar in a straight line overhead, lock out at the top, keep ribs down.'),
    (new.id, 'Lateral Raises',      'Shoulders', 'Slight bend in the elbows, lead with the elbows not the hands, raise to shoulder height only, control the descent.'),
    (new.id, 'Front Raises',        'Shoulders', 'Keep a slight bend in the elbow, raise to shoulder height, avoid swinging, lower with control.'),
    (new.id, 'Face Pulls',          'Shoulders', 'Set the cable at face height, pull to your forehead with elbows high and wide, focus on external rotation at the end.'),
    (new.id, 'Arnold Press',        'Shoulders', 'Start with palms facing you, rotate outward as you press, full range of motion, control the return.'),
    (new.id, 'Barbell Curl',        'Arms',      'Keep elbows pinned at your sides, curl through the full range of motion, squeeze the bicep at the top, lower with control.'),
    (new.id, 'Hammer Curl',         'Arms',      'Neutral grip throughout, keep elbows still, curl to shoulder height, controlled descent.'),
    (new.id, 'Tricep Pushdown',     'Arms',      'Elbows tucked at your sides, push down to full extension, squeeze the tricep, control the return.'),
    (new.id, 'Skull Crushers',      'Arms',      'Keep upper arms vertical and still, lower the bar to your forehead with control, extend fully at the top.'),
    (new.id, 'Dips',                'Arms',      'Keep torso upright to target triceps, lower until elbows reach 90 degrees, push to full extension at the top.'),
    (new.id, 'Squat',               'Legs',      'Feet shoulder-width apart, brace core, sit into the squat with knees tracking toes, hip crease below parallel, drive through the whole foot.'),
    (new.id, 'Romanian Deadlift',   'Legs',      'Hinge at hips with soft knees, bar stays close to the legs, lower until you feel a hamstring stretch, drive hips forward to stand.'),
    (new.id, 'Leg Press',           'Legs',      'Feet shoulder-width on the platform, lower until knees reach 90 degrees, do not let knees cave inward, push through the whole foot.'),
    (new.id, 'Hamstring Curl',      'Legs',      'Lie flat, curl the weight toward your glutes, squeeze at the top, lower with control, avoid lifting hips off the pad.'),
    (new.id, 'Leg Extension',       'Legs',      'Sit upright, extend to full lockout, squeeze the quad at the top, lower with control, avoid swinging.'),
    (new.id, 'Walking Lunges',      'Legs',      'Take a full stride, lower the back knee toward the floor, keep front knee tracking over toes, stay upright through the torso.'),
    (new.id, 'Plank',               'Core',      'Forearms on the floor, body in a straight line from head to heels, brace the core hard, breathe steadily, do not let hips sag or rise.'),
    (new.id, 'Hanging Leg Raises',  'Core',      'Dead hang to start, raise legs to 90 degrees or higher, avoid swinging, lower with control.'),
    (new.id, 'Cable Crunches',      'Core',      'Kneel facing the cable, hold rope at your head, crunch by bringing elbows to knees, focus on the abs not the hip flexors.'),
    (new.id, 'Ab Wheel Rollout',    'Core',      'Start on knees, brace core hard, roll out as far as you can control, pull back using your abs not your arms.');
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
      insert into public.exercises (user_id, name, body_part, form_tips) values
        (u.id, 'Bench Press',         'Chest',     'Retract your shoulder blades, plant your feet flat, lower the bar to your lower chest with a controlled 2-second descent, drive through your chest on the way up.'),
        (u.id, 'Incline Bench Press', 'Chest',     'Set the bench to 30-45 degrees, keep elbows at roughly 45 degrees from your torso, focus on squeezing the upper chest at the top.'),
        (u.id, 'Dips',                'Chest',     'Lean slightly forward to target chest, lower until shoulders are below elbows, avoid shrugging at the top.'),
        (u.id, 'Cable Flyes',         'Chest',     'Keep a slight bend in the elbows throughout, focus on squeezing the chest at the centre, control the return.'),
        (u.id, 'Push Ups',            'Chest',     'Keep your body in a straight line from head to heels, lower your chest to the floor, elbows at roughly 45 degrees.'),
        (u.id, 'Deadlift',            'Back',      'Hinge at the hips, neutral spine throughout, bar stays close to the body, drive through the floor and lock out hips and knees simultaneously.'),
        (u.id, 'Pull Ups',            'Back',      'Start from a dead hang, drive elbows down and back, chin clears the bar, lower with control.'),
        (u.id, 'Bent Over Row',       'Back',      'Hinge to roughly 45 degrees, retract the scapula before pulling, drive elbows back, squeeze at the top.'),
        (u.id, 'Lat Pulldown',        'Back',      'Slight lean back, pull the bar to your upper chest, focus on driving elbows down rather than pulling with hands.'),
        (u.id, 'Seated Cable Row',    'Back',      'Sit tall, retract shoulder blades first, pull to the lower abdomen, control the return without rounding the back.'),
        (u.id, 'Overhead Press',      'Shoulders', 'Brace your core, press the bar in a straight line overhead, lock out at the top, keep ribs down.'),
        (u.id, 'Lateral Raises',      'Shoulders', 'Slight bend in the elbows, lead with the elbows not the hands, raise to shoulder height only, control the descent.'),
        (u.id, 'Front Raises',        'Shoulders', 'Keep a slight bend in the elbow, raise to shoulder height, avoid swinging, lower with control.'),
        (u.id, 'Face Pulls',          'Shoulders', 'Set the cable at face height, pull to your forehead with elbows high and wide, focus on external rotation at the end.'),
        (u.id, 'Arnold Press',        'Shoulders', 'Start with palms facing you, rotate outward as you press, full range of motion, control the return.'),
        (u.id, 'Barbell Curl',        'Arms',      'Keep elbows pinned at your sides, curl through the full range of motion, squeeze the bicep at the top, lower with control.'),
        (u.id, 'Hammer Curl',         'Arms',      'Neutral grip throughout, keep elbows still, curl to shoulder height, controlled descent.'),
        (u.id, 'Tricep Pushdown',     'Arms',      'Elbows tucked at your sides, push down to full extension, squeeze the tricep, control the return.'),
        (u.id, 'Skull Crushers',      'Arms',      'Keep upper arms vertical and still, lower the bar to your forehead with control, extend fully at the top.'),
        (u.id, 'Dips',                'Arms',      'Keep torso upright to target triceps, lower until elbows reach 90 degrees, push to full extension at the top.'),
        (u.id, 'Squat',               'Legs',      'Feet shoulder-width apart, brace core, sit into the squat with knees tracking toes, hip crease below parallel, drive through the whole foot.'),
        (u.id, 'Romanian Deadlift',   'Legs',      'Hinge at hips with soft knees, bar stays close to the legs, lower until you feel a hamstring stretch, drive hips forward to stand.'),
        (u.id, 'Leg Press',           'Legs',      'Feet shoulder-width on the platform, lower until knees reach 90 degrees, do not let knees cave inward, push through the whole foot.'),
        (u.id, 'Hamstring Curl',      'Legs',      'Lie flat, curl the weight toward your glutes, squeeze at the top, lower with control, avoid lifting hips off the pad.'),
        (u.id, 'Leg Extension',       'Legs',      'Sit upright, extend to full lockout, squeeze the quad at the top, lower with control, avoid swinging.'),
        (u.id, 'Walking Lunges',      'Legs',      'Take a full stride, lower the back knee toward the floor, keep front knee tracking over toes, stay upright through the torso.'),
        (u.id, 'Plank',               'Core',      'Forearms on the floor, body in a straight line from head to heels, brace the core hard, breathe steadily, do not let hips sag or rise.'),
        (u.id, 'Hanging Leg Raises',  'Core',      'Dead hang to start, raise legs to 90 degrees or higher, avoid swinging, lower with control.'),
        (u.id, 'Cable Crunches',      'Core',      'Kneel facing the cable, hold rope at your head, crunch by bringing elbows to knees, focus on the abs not the hip flexors.'),
        (u.id, 'Ab Wheel Rollout',    'Core',      'Start on knees, brace core hard, roll out as far as you can control, pull back using your abs not your arms.');
    end if;
  end loop;
end;
$$;


-- ============================================================
-- MIGRATION v2 → v3  (run ONLY this section on an existing database)
-- ============================================================
-- Step 1: add the column
alter table exercises add column if not exists form_tips text;

-- Step 2: populate form_tips for existing classic exercises
-- Uses name + body_part to target the correct row.
-- Only updates rows where form_tips is still null (safe to re-run).
update exercises set form_tips = 'Retract your shoulder blades, plant your feet flat, lower the bar to your lower chest with a controlled 2-second descent, drive through your chest on the way up.'
  where name = 'Bench Press' and body_part = 'Chest' and form_tips is null;
update exercises set form_tips = 'Set the bench to 30-45 degrees, keep elbows at roughly 45 degrees from your torso, focus on squeezing the upper chest at the top.'
  where name = 'Incline Bench Press' and body_part = 'Chest' and form_tips is null;
update exercises set form_tips = 'Lean slightly forward to target chest, lower until shoulders are below elbows, avoid shrugging at the top.'
  where name = 'Dips' and body_part = 'Chest' and form_tips is null;
update exercises set form_tips = 'Keep a slight bend in the elbows throughout, focus on squeezing the chest at the centre, control the return.'
  where name = 'Cable Flyes' and body_part = 'Chest' and form_tips is null;
update exercises set form_tips = 'Keep your body in a straight line from head to heels, lower your chest to the floor, elbows at roughly 45 degrees.'
  where name = 'Push Ups' and body_part = 'Chest' and form_tips is null;
update exercises set form_tips = 'Hinge at the hips, neutral spine throughout, bar stays close to the body, drive through the floor and lock out hips and knees simultaneously.'
  where name = 'Deadlift' and body_part = 'Back' and form_tips is null;
update exercises set form_tips = 'Start from a dead hang, drive elbows down and back, chin clears the bar, lower with control.'
  where name = 'Pull Ups' and body_part = 'Back' and form_tips is null;
update exercises set form_tips = 'Hinge to roughly 45 degrees, retract the scapula before pulling, drive elbows back, squeeze at the top.'
  where name = 'Bent Over Row' and body_part = 'Back' and form_tips is null;
update exercises set form_tips = 'Slight lean back, pull the bar to your upper chest, focus on driving elbows down rather than pulling with hands.'
  where name = 'Lat Pulldown' and body_part = 'Back' and form_tips is null;
update exercises set form_tips = 'Sit tall, retract shoulder blades first, pull to the lower abdomen, control the return without rounding the back.'
  where name = 'Seated Cable Row' and body_part = 'Back' and form_tips is null;
update exercises set form_tips = 'Brace your core, press the bar in a straight line overhead, lock out at the top, keep ribs down.'
  where name = 'Overhead Press' and body_part = 'Shoulders' and form_tips is null;
update exercises set form_tips = 'Slight bend in the elbows, lead with the elbows not the hands, raise to shoulder height only, control the descent.'
  where name = 'Lateral Raises' and body_part = 'Shoulders' and form_tips is null;
update exercises set form_tips = 'Keep a slight bend in the elbow, raise to shoulder height, avoid swinging, lower with control.'
  where name = 'Front Raises' and body_part = 'Shoulders' and form_tips is null;
update exercises set form_tips = 'Set the cable at face height, pull to your forehead with elbows high and wide, focus on external rotation at the end.'
  where name = 'Face Pulls' and body_part = 'Shoulders' and form_tips is null;
update exercises set form_tips = 'Start with palms facing you, rotate outward as you press, full range of motion, control the return.'
  where name = 'Arnold Press' and body_part = 'Shoulders' and form_tips is null;
update exercises set form_tips = 'Keep elbows pinned at your sides, curl through the full range of motion, squeeze the bicep at the top, lower with control.'
  where name = 'Barbell Curl' and body_part = 'Arms' and form_tips is null;
update exercises set form_tips = 'Neutral grip throughout, keep elbows still, curl to shoulder height, controlled descent.'
  where name = 'Hammer Curl' and body_part = 'Arms' and form_tips is null;
update exercises set form_tips = 'Elbows tucked at your sides, push down to full extension, squeeze the tricep, control the return.'
  where name = 'Tricep Pushdown' and body_part = 'Arms' and form_tips is null;
update exercises set form_tips = 'Keep upper arms vertical and still, lower the bar to your forehead with control, extend fully at the top.'
  where name = 'Skull Crushers' and body_part = 'Arms' and form_tips is null;
update exercises set form_tips = 'Keep torso upright to target triceps, lower until elbows reach 90 degrees, push to full extension at the top.'
  where name = 'Dips' and body_part = 'Arms' and form_tips is null;
update exercises set form_tips = 'Feet shoulder-width apart, brace core, sit into the squat with knees tracking toes, hip crease below parallel, drive through the whole foot.'
  where name = 'Squat' and body_part = 'Legs' and form_tips is null;
update exercises set form_tips = 'Hinge at hips with soft knees, bar stays close to the legs, lower until you feel a hamstring stretch, drive hips forward to stand.'
  where name = 'Romanian Deadlift' and body_part = 'Legs' and form_tips is null;
update exercises set form_tips = 'Feet shoulder-width on the platform, lower until knees reach 90 degrees, do not let knees cave inward, push through the whole foot.'
  where name = 'Leg Press' and body_part = 'Legs' and form_tips is null;
update exercises set form_tips = 'Lie flat, curl the weight toward your glutes, squeeze at the top, lower with control, avoid lifting hips off the pad.'
  where name = 'Hamstring Curl' and body_part = 'Legs' and form_tips is null;
update exercises set form_tips = 'Sit upright, extend to full lockout, squeeze the quad at the top, lower with control, avoid swinging.'
  where name = 'Leg Extension' and body_part = 'Legs' and form_tips is null;
update exercises set form_tips = 'Take a full stride, lower the back knee toward the floor, keep front knee tracking over toes, stay upright through the torso.'
  where name = 'Walking Lunges' and body_part = 'Legs' and form_tips is null;
update exercises set form_tips = 'Forearms on the floor, body in a straight line from head to heels, brace the core hard, breathe steadily, do not let hips sag or rise.'
  where name = 'Plank' and body_part = 'Core' and form_tips is null;
update exercises set form_tips = 'Dead hang to start, raise legs to 90 degrees or higher, avoid swinging, lower with control.'
  where name = 'Hanging Leg Raises' and body_part = 'Core' and form_tips is null;
update exercises set form_tips = 'Kneel facing the cable, hold rope at your head, crunch by bringing elbows to knees, focus on the abs not the hip flexors.'
  where name = 'Cable Crunches' and body_part = 'Core' and form_tips is null;
update exercises set form_tips = 'Start on knees, brace core hard, roll out as far as you can control, pull back using your abs not your arms.'
  where name = 'Ab Wheel Rollout' and body_part = 'Core' and form_tips is null;
