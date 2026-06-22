-- ============================================================================
-- Feynman Challenge — Initial Schema
-- Reference: docs/feynman_challenge_master.md §7
-- 6 tables + RLS policies + profile-creation trigger + updated_at triggers.
-- Idempotent-friendly: safe to re-run (uses IF NOT EXISTS / DROP ... IF EXISTS).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles — extends auth.users (created via trigger on sign-up)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text,
  streak_count     integer     not null default 0,
  best_streak      integer     not null default 0,
  last_active_date date,
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. challenges — core learning challenge entity
-- ----------------------------------------------------------------------------
create table if not exists public.challenges (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid        not null references public.profiles (id) on delete cascade,
  title                   text        not null,
  deadline                timestamptz,
  extended_deadline       timestamptz,
  mastery_state           text        not null default 'not_started'
    check (mastery_state in ('not_started', 'attempted', 'developing', 'proficient', 'mastered', 'solidified')),
  mastery_updated_at      timestamptz not null default now(),
  latest_score            integer,
  best_score              integer,
  recording_duration_sec  integer,
  status                  text        not null default 'active'
    check (status in ('active', 'parked', 'completed')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_challenges_user_id on public.challenges (user_id);

-- ----------------------------------------------------------------------------
-- 3. challenge_outlines — AI-generated + user-editable rubric items
-- ----------------------------------------------------------------------------
create table if not exists public.challenge_outlines (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid        not null references public.challenges (id) on delete cascade,
  order_index   integer     not null,
  title         text        not null,
  description   text,
  is_user_added boolean     not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_challenge_outlines_challenge_id on public.challenge_outlines (challenge_id);

-- ----------------------------------------------------------------------------
-- 4. challenge_sources — learning resources (AI-suggested + user-added)
-- ----------------------------------------------------------------------------
create table if not exists public.challenge_sources (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid        not null references public.challenges (id) on delete cascade,
  title           text        not null,
  url             text,
  source_type     text        not null default 'other'
    check (source_type in ('video', 'article', 'book', 'paper', 'other')),
  is_ai_suggested boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_challenge_sources_challenge_id on public.challenge_sources (challenge_id);

-- ----------------------------------------------------------------------------
-- 5. challenge_notes — one personal markdown note doc per challenge
-- ----------------------------------------------------------------------------
create table if not exists public.challenge_notes (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid        not null unique references public.challenges (id) on delete cascade,
  content      text        not null default '',
  updated_at   timestamptz not null default now()
);

create index if not exists idx_challenge_notes_challenge_id on public.challenge_notes (challenge_id);

-- ----------------------------------------------------------------------------
-- 6. attempts — each recording + evaluation result
-- ----------------------------------------------------------------------------
create table if not exists public.attempts (
  id                     uuid primary key default gen_random_uuid(),
  challenge_id           uuid        not null references public.challenges (id) on delete cascade,
  attempt_number         integer     not null,
  audio_storage_path     text,
  duration_seconds       integer,
  hint_level_used        text        not null default 'none'
    check (hint_level_used in ('none', 'keywords', 'guiding_questions', 'outline')),
  max_possible_score     integer,
  transcript             text,
  overall_score          integer,
  comprehensiveness_score integer,
  accuracy_score         integer,
  clarity_score          integer,
  feedback               text,
  strengths              jsonb,
  improvements           jsonb,
  coverage               jsonb,
  evaluation_status      text        not null default 'pending'
    check (evaluation_status in ('pending', 'processing', 'completed', 'error')),
  created_at             timestamptz not null default now()
);

create index if not exists idx_attempts_challenge_id on public.attempts (challenge_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at fresh on row updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_challenges_updated_at on public.challenges;
create trigger set_challenges_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

drop trigger if exists set_challenge_notes_updated_at on public.challenge_notes;
create trigger set_challenge_notes_updated_at
  before update on public.challenge_notes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security — users may only access their own data
-- ============================================================================

alter table public.profiles           enable row level security;
alter table public.challenges          enable row level security;
alter table public.challenge_outlines  enable row level security;
alter table public.challenge_sources   enable row level security;
alter table public.challenge_notes     enable row level security;
alter table public.attempts            enable row level security;

-- profiles: owner is the row id itself.
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (id = (select auth.uid()));

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (id = (select auth.uid()));

-- challenges: owner is user_id.
drop policy if exists "Challenges are accessible by owner" on public.challenges;
create policy "Challenges are accessible by owner"
  on public.challenges for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Child tables: ownership resolved through the parent challenge.
drop policy if exists "Outlines are accessible by challenge owner" on public.challenge_outlines;
create policy "Outlines are accessible by challenge owner"
  on public.challenge_outlines for all
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ));

drop policy if exists "Sources are accessible by challenge owner" on public.challenge_sources;
create policy "Sources are accessible by challenge owner"
  on public.challenge_sources for all
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ));

drop policy if exists "Notes are accessible by challenge owner" on public.challenge_notes;
create policy "Notes are accessible by challenge owner"
  on public.challenge_notes for all
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ));

drop policy if exists "Attempts are accessible by challenge owner" on public.attempts;
create policy "Attempts are accessible by challenge owner"
  on public.attempts for all
  using (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.user_id = (select auth.uid())
  ));
