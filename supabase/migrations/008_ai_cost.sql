-- ---------------------------------------------------------------------------
-- 008_ai_cost.sql — plafon berbobot dan pencatatan biaya AI.
--
-- Dua cacat yang diperbaiki di sini:
--
--   1. Plafon global di 007 memakai count(*), jadi satu panggilan `hints`
--      (murah, thinkingBudget 256) memakan jatah yang sama dengan satu
--      `evaluate` (audio tiga menit). Banjir panggilan murah bisa
--      menghentikan evaluasi untuk semua orang. Sekarang plafon dihitung
--      dalam UNIT BERBOBOT, dan bobotnya dikirim pemanggil supaya angkanya
--      hanya hidup di satu tempat: src/lib/ai/usage.ts.
--
--   2. usageMetadata dari Gemini dibuang, sehingga plafon harian hanya
--      tebakan. Sekarang jumlah token dan lama panggilan dicatat, tanpa
--      pernah menyimpan isi prompt, transkrip, atau audio.
--
-- ai_global_per_day BERUBAH MAKNA: sekarang unit per hari, bukan jumlah
-- panggilan. Dengan bobot di bawah, 500 unit kira-kira 100 evaluasi.
--
-- Idempotent: aman dijalankan berulang kali.
-- ---------------------------------------------------------------------------

alter table public.ai_usage
  add column if not exists cost_units      integer not null default 1,
  add column if not exists model           text,
  add column if not exists prompt_tokens   integer,
  add column if not exists output_tokens   integer,
  add column if not exists thinking_tokens integer,
  add column if not exists latency_ms      integer;

comment on column public.ai_usage.cost_units is
  'Bobot biaya panggilan ini. Plafon global menjumlahkan kolom ini, bukan baris.';

comment on column public.app_settings.ai_global_per_day is
  'Plafon UNIT BERBOBOT per 24 jam untuk seluruh aplikasi (lihat ai_usage.cost_units), bukan jumlah panggilan.';

-- ----------------------------------------------------------------------------
-- consume_ai_quota, versi ketiga.
--
-- Berubah dari 007: menerima p_cost_units, plafon global menjumlahkan
-- cost_units, dan hasilnya membawa usage_id supaya pemanggil bisa melengkapi
-- baris itu dengan jumlah token setelah panggilan Gemini selesai.
-- ----------------------------------------------------------------------------
drop function if exists public.consume_ai_quota(text, integer, integer);
drop function if exists public.consume_ai_quota(text, integer, integer, integer);

create function public.consume_ai_quota(
  p_kind       text,
  p_per_day    integer,
  p_per_minute integer,
  p_cost_units integer default 1
)
returns table (
  allowed             boolean,
  retry_after_seconds integer,
  reason              text,
  usage_id            uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user         uuid := auth.uid();
  v_enabled      boolean;
  v_global_limit integer;
  v_global_units integer;
  v_day_count    integer;
  v_min_count    integer;
  v_day_oldest   timestamptz;
  v_min_oldest   timestamptz;
  v_units        integer := greatest(1, coalesce(p_cost_units, 1));
  v_id           uuid;
begin
  if v_user is null then
    return query select false, 0, 'anon'::text, null::uuid;
    return;
  end if;

  select s.ai_enabled, s.ai_global_per_day
    into v_enabled, v_global_limit
  from public.app_settings s
  where s.id = 1;

  if v_enabled is null then
    v_enabled := true;
    v_global_limit := null;
  end if;

  if not v_enabled then
    return query select false, 0, 'disabled'::text, null::uuid;
    return;
  end if;

  -- Pagar biaya, bukan penghitung akuntansi: sengaja tanpa advisory lock
  -- global, karena mengunci seluruh aplikasi di tiap panggilan akan membuat
  -- semua permintaan antre. Kelebihan beberapa unit dapat diterima.
  if v_global_limit is not null then
    select coalesce(sum(cost_units), 0) into v_global_units
    from public.ai_usage
    where created_at > now() - interval '24 hours';

    if v_global_units + v_units > v_global_limit then
      return query select false, 3600, 'global'::text, null::uuid;
      return;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text || ':' || p_kind));

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
      greatest(1, ceil(extract(epoch from (v_min_oldest + interval '1 minute' - now())))::integer),
      'minute'::text, null::uuid;
    return;
  end if;

  if v_day_count >= p_per_day then
    return query select false,
      greatest(1, ceil(extract(epoch from (v_day_oldest + interval '24 hours' - now())))::integer),
      'day'::text, null::uuid;
    return;
  end if;

  insert into public.ai_usage (user_id, kind, cost_units)
  values (v_user, p_kind, v_units)
  returning id into v_id;

  return query select true, 0, 'ok'::text, v_id;
end;
$$;

comment on function public.consume_ai_quota(text, integer, integer, integer) is
  'Memakai satu jatah AI untuk pemanggil. Memeriksa saklar mati dan plafon unit harian global (app_settings) sebelum kuota per pengguna.';

-- ----------------------------------------------------------------------------
-- record_ai_usage: melengkapi baris yang sudah dibuat consume_ai_quota dengan
-- angka pemakaian, setelah panggilan Gemini selesai.
--
-- security definer karena RLS di ai_usage melarang update oleh siapa pun;
-- kepemilikan barisnya diperiksa di dalam. Tidak menerima teks apa pun selain
-- nama model, jadi tidak mungkin dipakai menyimpan isi percakapan.
-- ----------------------------------------------------------------------------
create or replace function public.record_ai_usage(
  p_usage_id        uuid,
  p_model           text,
  p_prompt_tokens   integer,
  p_output_tokens   integer,
  p_thinking_tokens integer,
  p_latency_ms      integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or p_usage_id is null then
    return;
  end if;

  update public.ai_usage
  set model           = left(coalesce(p_model, ''), 100),
      prompt_tokens   = p_prompt_tokens,
      output_tokens   = p_output_tokens,
      thinking_tokens = p_thinking_tokens,
      latency_ms      = p_latency_ms
  where id = p_usage_id
    and user_id = auth.uid();
end;
$$;
