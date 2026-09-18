-- ============================================================================
-- Feynman Challenge — 004: Timezone-aware dates & derived state
-- Reference: prompts/improvement-plan.md, Prompt 1.5
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles.timezone — every "what day is it" computation uses this.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists timezone text not null default 'Asia/Jakarta';

-- Signup trigger: also capture the browser's timezone from user metadata,
-- validated against pg_timezone_names (anything unknown falls back to WIB).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz text := new.raw_user_meta_data ->> 'timezone';
begin
  if v_tz is null or not exists (select 1 from pg_timezone_names where name = v_tz) then
    v_tz := 'Asia/Jakarta';
  end if;

  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    v_tz
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- challenges.last_attempt_at — when the latest evaluation completed.
-- Replaces scanning the whole attempts table from the dashboard.
-- ----------------------------------------------------------------------------
alter table public.challenges
  add column if not exists last_attempt_at timestamptz;

update public.challenges c
set last_attempt_at = a.last_completed
from (
  select challenge_id, max(created_at) as last_completed
  from public.attempts
  where evaluation_status = 'completed'
  group by challenge_id
) a
where a.challenge_id = c.id
  and c.last_attempt_at is null;

-- ----------------------------------------------------------------------------
-- challenges.deadline: timestamptz -> date (decision D2).
-- A deadline is a calendar day, not an instant. Existing values were created
-- by WIB users at local 23:59:59, so converting in Asia/Jakarta keeps the day.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges'
      and column_name = 'deadline' and data_type = 'timestamp with time zone'
  ) then
    alter table public.challenges
      alter column deadline type date
      using (deadline at time zone 'Asia/Jakarta')::date;
  end if;
end $$;

-- Auto-extension is derived at read time (deadline + 2 days); nothing to store.
alter table public.challenges drop column if exists extended_deadline;

-- ----------------------------------------------------------------------------
-- attempts: latest-first lookups per challenge.
-- ----------------------------------------------------------------------------
create index if not exists idx_attempts_challenge_created
  on public.attempts (challenge_id, created_at desc);

-- ----------------------------------------------------------------------------
-- finalize_attempt_evaluation now also stamps challenges.last_attempt_at.
-- Same signature as in 003; body replaced.
-- ----------------------------------------------------------------------------
create or replace function public.finalize_attempt_evaluation(
  p_attempt_id            uuid,
  p_transcript            text,
  p_overall_score         integer,
  p_comprehensiveness_score integer,
  p_accuracy_score        integer,
  p_clarity_score         integer,
  p_feedback              text,
  p_strengths             jsonb,
  p_improvements          jsonb,
  p_coverage              jsonb,
  p_mastery_state         text,
  p_mastery_changed       boolean,
  p_streak_count          integer,
  p_best_streak           integer,
  p_last_active_date      date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_challenge_id uuid;
  v_user_id      uuid;
begin
  update public.attempts
  set
    transcript              = p_transcript,
    overall_score           = p_overall_score,
    comprehensiveness_score = p_comprehensiveness_score,
    accuracy_score          = p_accuracy_score,
    clarity_score           = p_clarity_score,
    feedback                = p_feedback,
    strengths               = p_strengths,
    improvements            = p_improvements,
    coverage                = p_coverage,
    evaluation_status       = 'completed',
    evaluation_error        = null
  where id = p_attempt_id
    and evaluation_status = 'processing'
  returning challenge_id into v_challenge_id;

  if v_challenge_id is null then
    raise exception 'attempt % is not being processed', p_attempt_id
      using errcode = 'P0002';
  end if;

  update public.challenges
  set
    latest_score       = p_overall_score,
    best_score         = greatest(coalesce(best_score, 0), p_overall_score),
    mastery_state      = p_mastery_state,
    mastery_updated_at = case when p_mastery_changed then now() else mastery_updated_at end,
    last_attempt_at    = now()
  where id = v_challenge_id
  returning user_id into v_user_id;

  if p_last_active_date is not null then
    update public.profiles
    set
      streak_count     = p_streak_count,
      best_streak      = p_best_streak,
      last_active_date = p_last_active_date
    where id = v_user_id;
  end if;
end;
$$;
