-- ============================================================================
-- Feynman Challenge — 003: Recording & evaluation pipeline
-- Reference: prompts/improvement-plan.md, Prompt 1.2 (this part) and 1.3
-- (claim/finalize functions + ai_usage, appended in the same file later).
-- Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- attempts: evaluation bookkeeping
-- ----------------------------------------------------------------------------
alter table public.attempts
  add column if not exists evaluation_started_at timestamptz,
  add column if not exists evaluation_error      text;

-- One attempt number per challenge. The API retries on conflict.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attempts_challenge_id_attempt_number_key'
  ) then
    alter table public.attempts
      add constraint attempts_challenge_id_attempt_number_key
      unique (challenge_id, attempt_number);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Storage: hard limits on the recordings bucket.
-- Audio is now uploaded directly from the browser (RLS in 002 already scopes
-- users to their own {user_id}/ prefix), so the bucket itself must enforce
-- size and type. 10 MB covers ~40 min at 32 kbps; recordings max out at 10 min.
-- Content types are compared without codec parameters, so clients must send
-- "audio/webm", not "audio/webm;codecs=opus".
-- ----------------------------------------------------------------------------
update storage.buckets
set
  file_size_limit    = 10 * 1024 * 1024,
  allowed_mime_types = array['audio/webm', 'audio/mp4', 'audio/ogg']
where id = 'recordings';

-- ============================================================================
-- Prompt 1.3 — atomic evaluation + per-user AI quota
-- ============================================================================

-- ----------------------------------------------------------------------------
-- claim_attempt_evaluation: the ONLY way an evaluation may start.
-- Returns the attempt row when this caller won the claim, nothing otherwise.
-- Claimable: pending, error, or a processing row that is stale (> 2 minutes,
-- i.e. the previous worker died past Vercel's 60 s limit).
-- security invoker => RLS still restricts to the caller's own attempts.
-- ----------------------------------------------------------------------------
create or replace function public.claim_attempt_evaluation(p_attempt_id uuid)
returns setof public.attempts
language sql
security invoker
set search_path = public
as $$
  update public.attempts
  set
    evaluation_status     = 'processing',
    evaluation_started_at = now(),
    evaluation_error      = null
  where id = p_attempt_id
    and (
      evaluation_status in ('pending', 'error')
      or (
        evaluation_status = 'processing'
        and (evaluation_started_at is null
             or evaluation_started_at < now() - interval '2 minutes')
      )
    )
  returning *;
$$;

-- ----------------------------------------------------------------------------
-- finalize_attempt_evaluation: writes attempt result, challenge scores/mastery
-- and profile streak in ONE transaction. All values are computed in
-- TypeScript; this function only persists them. It refuses to finalize an
-- attempt that is not currently 'processing' (guards against double writes).
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
  p_last_active_date      date      -- null = streak unchanged, skip profile update
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
    mastery_updated_at = case when p_mastery_changed then now() else mastery_updated_at end
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
-- ai_usage: one row per Gemini call, per user. Users can read their own rows
-- but never insert/update/delete directly; only consume_ai_quota writes.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  kind       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user_kind_created
  on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists "AI usage is viewable by owner" on public.ai_usage;
create policy "AI usage is viewable by owner"
  on public.ai_usage for select
  using (user_id = (select auth.uid()));

-- consume_ai_quota: atomically checks the caller's usage of `p_kind` in the
-- last 24 h / 1 min against the given limits and records one use if allowed.
-- Returns allowed + how long until the next use would be allowed.
-- security definer so it can insert despite the no-insert RLS above; the
-- advisory lock serialises concurrent calls from the same user.
create or replace function public.consume_ai_quota(
  p_kind       text,
  p_per_day    integer,
  p_per_minute integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       uuid := auth.uid();
  v_day_count  integer;
  v_min_count  integer;
  v_day_oldest timestamptz;
  v_min_oldest timestamptz;
begin
  if v_user is null then
    return query select false, 0;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text || ':' || p_kind));

  -- Opportunistic cleanup: rows outside the 24 h window are dead weight.
  delete from public.ai_usage
  where user_id = v_user and kind = p_kind
    and created_at < now() - interval '25 hours';

  select
    count(*),
    min(created_at),
    count(*) filter (where created_at > now() - interval '1 minute'),
    min(created_at) filter (where created_at > now() - interval '1 minute')
  into v_day_count, v_day_oldest, v_min_count, v_min_oldest
  from public.ai_usage
  where user_id = v_user and kind = p_kind
    and created_at > now() - interval '24 hours';

  if v_min_count >= p_per_minute then
    return query select false,
      greatest(1, ceil(extract(epoch from (v_min_oldest + interval '1 minute' - now())))::integer);
    return;
  end if;

  if v_day_count >= p_per_day then
    return query select false,
      greatest(1, ceil(extract(epoch from (v_day_oldest + interval '24 hours' - now())))::integer);
    return;
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, p_kind);
  return query select true, 0;
end;
$$;

revoke all on function public.consume_ai_quota(text, integer, integer) from public;
grant execute on function public.consume_ai_quota(text, integer, integer) to authenticated;
