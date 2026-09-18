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
