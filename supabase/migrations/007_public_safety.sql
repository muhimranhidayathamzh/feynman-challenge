-- ---------------------------------------------------------------------------
-- 007_public_safety.sql — rem darurat untuk pemakaian publik.
--
-- Sebelum ini, satu-satunya pengaman adalah kuota per user. Di web publik itu
-- tidak cukup: siapa pun bisa membuat akun anonim tanpa batas, jadi kuota
-- per-akun praktis tidak membatasi total biaya.
--
-- Migrasi ini menambahkan dua pengaman yang berlaku untuk SELURUH aplikasi
-- dan bisa diubah tanpa deploy ulang:
--
--   1. Saklar mati (ai_enabled)      — hentikan semua panggilan AI seketika.
--   2. Plafon harian (ai_global_per_day) — batas total panggilan AI per 24 jam,
--                                          digabung dari semua pengguna.
--
-- Cara menarik rem, dari Supabase SQL Editor:
--
--   update public.app_settings set ai_enabled = false where id = 1;   -- matikan
--   update public.app_settings set ai_enabled = true  where id = 1;   -- nyalakan
--   update public.app_settings set ai_global_per_day = 1000 where id = 1;
--
-- Idempotent: aman dijalankan berulang kali.
-- ---------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- app_settings: tepat satu baris (id = 1) berisi pengaturan seluruh aplikasi.
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  id                integer primary key default 1 check (id = 1),
  ai_enabled        boolean not null default true,
  ai_global_per_day integer not null default 500 check (ai_global_per_day >= 0),
  updated_at        timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- RLS menyala TANPA policy apa pun: tidak ada pengguna (anon maupun login)
-- yang bisa membaca atau mengubahnya lewat API. Hanya service role dan fungsi
-- security definer di bawah yang bisa menyentuhnya.
alter table public.app_settings enable row level security;

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Plafon global menghitung SEMUA baris dalam 24 jam terakhir, lintas pengguna.
-- Index yang ada di 003 diawali user_id, jadi tidak terpakai untuk itu.
create index if not exists idx_ai_usage_created
  on public.ai_usage (created_at desc);

-- ----------------------------------------------------------------------------
-- consume_ai_quota, versi kedua.
--
-- Perubahan dari 003: menambah kolom `reason` pada hasil, memeriksa saklar
-- mati, dan memeriksa plafon harian global sebelum kuota per pengguna.
-- Tanda tangan argumen tidak berubah, jadi pemanggil lama tetap cocok — tapi
-- tipe kembaliannya berubah, sehingga fungsinya harus di-drop dulu.
--
-- Catatan ketelitian yang disengaja: plafon global TIDAK memakai advisory lock
-- global. Mengunci seluruh aplikasi di setiap panggilan AI akan membuat semua
-- permintaan antre satu per satu. Akibatnya, saat banyak permintaan bersamaan,
-- plafon bisa terlampaui beberapa panggilan. Itu dapat diterima: ini pagar
-- biaya, bukan penghitung akuntansi. Kuota per pengguna tetap presisi.
-- ----------------------------------------------------------------------------
drop function if exists public.consume_ai_quota(text, integer, integer);

create function public.consume_ai_quota(
  p_kind       text,
  p_per_day    integer,
  p_per_minute integer
)
returns table (allowed boolean, retry_after_seconds integer, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user         uuid := auth.uid();
  v_enabled      boolean;
  v_global_limit integer;
  v_global_count integer;
  v_day_count    integer;
  v_min_count    integer;
  v_day_oldest   timestamptz;
  v_min_oldest   timestamptz;
begin
  if v_user is null then
    return query select false, 0, 'anon'::text;
    return;
  end if;

  select s.ai_enabled, s.ai_global_per_day
    into v_enabled, v_global_limit
  from public.app_settings s
  where s.id = 1;

  -- Tabel belum terisi (mis. migrasi setengah jalan): jangan menghalangi.
  if v_enabled is null then
    v_enabled := true;
    v_global_limit := null;
  end if;

  if not v_enabled then
    return query select false, 0, 'disabled'::text;
    return;
  end if;

  if v_global_limit is not null then
    select count(*) into v_global_count
    from public.ai_usage
    where created_at > now() - interval '24 hours';

    if v_global_count >= v_global_limit then
      return query select false, 3600, 'global'::text;
      return;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text || ':' || p_kind));

  -- Pembersihan oportunistik: baris di luar jendela 24 jam hanya beban.
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
      'minute'::text;
    return;
  end if;

  if v_day_count >= p_per_day then
    return query select false,
      greatest(1, ceil(extract(epoch from (v_day_oldest + interval '24 hours' - now())))::integer),
      'day'::text;
    return;
  end if;

  insert into public.ai_usage (user_id, kind) values (v_user, p_kind);
  return query select true, 0, 'ok'::text;
end;
$$;

comment on function public.consume_ai_quota(text, integer, integer) is
  'Memakai satu jatah AI untuk pemanggil. Memeriksa saklar mati dan plafon harian global (app_settings) sebelum kuota per pengguna.';
