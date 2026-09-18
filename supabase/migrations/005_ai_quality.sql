-- ============================================================================
-- Feynman Challenge — 005: AI quality (hints, jargon, audio issues)
-- Reference: prompts/improvement-plan.md, Prompt 1.6
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- challenge_outlines: AI-generated hints per outline point.
-- keywords: 2–4 concepts that should appear in the explanation (NOT the title).
-- guiding_question: prompts the explanation without containing the answer.
-- Empty keywords / null question = hints missing or stale (regenerated lazily).
-- ----------------------------------------------------------------------------
alter table public.challenge_outlines
  add column if not exists keywords         text[] not null default '{}',
  add column if not exists guiding_question text;

-- ----------------------------------------------------------------------------
-- attempts: jargon the learner used without explaining, and audio problems.
-- audio_issue <> 'none' => the attempt is completed but NOT scored.
-- ----------------------------------------------------------------------------
alter table public.attempts
  add column if not exists unexplained_jargon jsonb,
  add column if not exists audio_issue        text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'attempts_audio_issue_check') then
    alter table public.attempts
      add constraint attempts_audio_issue_check
      check (audio_issue is null
             or audio_issue in ('none', 'silent', 'too_short', 'unintelligible', 'off_topic'));
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- finalize_attempt_evaluation gains p_unexplained_jargon. Drop the old
-- signature first so PostgREST doesn't see two overloads.
-- ----------------------------------------------------------------------------
drop function if exists public.finalize_attempt_evaluation(
  uuid, text, integer, integer, integer, integer, text, jsonb, jsonb, jsonb,
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
  p_mastery_state           text,
  p_mastery_changed         boolean,
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

-- ----------------------------------------------------------------------------
-- finalize_attempt_rejected: the audio could not be judged (silent, too short,
-- unintelligible, off topic). The attempt completes with NO scores and does
-- not touch mastery, latest_score, last_attempt_at, or the streak.
-- ----------------------------------------------------------------------------
create or replace function public.finalize_attempt_rejected(
  p_attempt_id  uuid,
  p_transcript  text,
  p_audio_issue text,
  p_feedback    text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_audio_issue not in ('silent', 'too_short', 'unintelligible', 'off_topic') then
    raise exception 'invalid audio issue %', p_audio_issue using errcode = '22023';
  end if;

  update public.attempts
  set
    transcript              = p_transcript,
    feedback                = p_feedback,
    audio_issue             = p_audio_issue,
    overall_score           = null,
    comprehensiveness_score = null,
    accuracy_score          = null,
    clarity_score           = null,
    strengths               = null,
    improvements            = null,
    coverage                = null,
    unexplained_jargon      = null,
    evaluation_status       = 'completed',
    evaluation_error        = null
  where id = p_attempt_id
    and evaluation_status = 'processing';

  if not found then
    raise exception 'attempt % is not being processed', p_attempt_id
      using errcode = 'P0002';
  end if;
end;
$$;
