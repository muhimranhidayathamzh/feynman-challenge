-- ============================================================================
-- Feynman Challenge — 006: Learning loop (spaced repetition + follow-ups)
-- Reference: prompts/improvement-plan.md, Prompts 3.1–3.3
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Spaced repetition (Prompt 3.1): a Leitner box 0..5 and the next review day.
-- Intervals per box: 1, 3, 7, 14, 30, 60 days (src/lib/utils/review.ts).
-- ----------------------------------------------------------------------------
alter table public.challenges
  add column if not exists review_box     integer not null default 0,
  add column if not exists next_review_at date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'challenges_review_box_check') then
    alter table public.challenges
      add constraint challenges_review_box_check check (review_box between 0 and 5);
  end if;
end $$;

-- Backfill challenges that were practised before this migration: start them in
-- a box matching their mastery, scheduled from the last attempt in the user's
-- timezone. Only touches rows that have never been scheduled.
with seeded as (
  select
    c.id,
    case c.mastery_state
      when 'solidified' then 4
      when 'mastered'   then 2
      when 'proficient' then 1
      else 0
    end as box,
    (c.last_attempt_at at time zone coalesce(p.timezone, 'Asia/Jakarta'))::date as last_day
  from public.challenges c
  join public.profiles p on p.id = c.user_id
  where c.last_attempt_at is not null
    and c.next_review_at is null
)
update public.challenges c
set
  review_box     = s.box,
  next_review_at = s.last_day + (array[1, 3, 7, 14, 30, 60])[s.box + 1]
from seeded s
where c.id = s.id;

create index if not exists idx_challenges_user_next_review
  on public.challenges (user_id, next_review_at);

-- ----------------------------------------------------------------------------
-- Socratic follow-up questions (Prompt 3.2) are produced by the same
-- evaluation call and stored on the attempt.
-- ----------------------------------------------------------------------------
alter table public.attempts
  add column if not exists follow_up_questions jsonb;

-- ----------------------------------------------------------------------------
-- finalize_attempt_evaluation: + review schedule + follow-up questions.
-- Drop the 005 signature first so PostgREST sees a single function.
-- ----------------------------------------------------------------------------
drop function if exists public.finalize_attempt_evaluation(
  uuid, text, integer, integer, integer, integer, text, jsonb, jsonb, jsonb, jsonb,
  text, boolean, integer, integer, date
);

create or replace function public.finalize_attempt_evaluation(
  p_attempt_id              uuid,
  p_transcript              text,
  p_overall_score           integer,
  p_comprehensiveness_score integer,
  p_accuracy_score          integer,
  p_clarity_score           integer,
  p_feedback                text,
  p_strengths               jsonb,
  p_improvements            jsonb,
  p_coverage                jsonb,
  p_unexplained_jargon      jsonb,
  p_follow_up_questions     jsonb,
  p_mastery_state           text,
  p_mastery_changed         boolean,
  p_review_box              integer,
  p_next_review_at          date,
  p_streak_count            integer,
  p_best_streak             integer,
  p_last_active_date        date
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
    unexplained_jargon      = p_unexplained_jargon,
    follow_up_questions     = p_follow_up_questions,
    audio_issue             = 'none',
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
    last_attempt_at    = now(),
    review_box         = p_review_box,
    next_review_at     = p_next_review_at
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
