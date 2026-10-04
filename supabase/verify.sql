-- ---------------------------------------------------------------------------
-- verify.sql — periksa apakah migrasi 001 sampai 009 sudah lengkap.
--
-- Jalankan di Supabase SQL Editor SETELAH menjalankan semua migrasi (001-009).
-- Hanya membaca, tidak mengubah apa pun. Aman diulang.
--
-- Semua baris harus "OK". Kalau ada "KURANG", jalankan ulang migrasi
-- yang disebut di kolom terakhir (semua migrasi idempotent).
-- ---------------------------------------------------------------------------

with expected_tables (name, from_migration) as (
  values
    ('profiles', '001'),
    ('challenges', '001'),
    ('challenge_outlines', '001'),
    ('challenge_sources', '001'),
    ('challenge_notes', '001'),
    ('attempts', '001'),
    ('ai_usage', '003'),
    ('app_settings', '007'),
    ('attempt_followups', '006')
),
expected_functions (name, from_migration) as (
  values
    ('handle_new_user', '001'),
    ('set_updated_at', '001'),
    ('claim_attempt_evaluation', '003'),
    ('finalize_attempt_evaluation', '003'),
    ('finalize_attempt_rejected', '003'),
    ('consume_ai_quota', '003'),
    ('record_ai_usage', '008')
),
expected_columns (tbl, col, from_migration) as (
  values
    ('profiles', 'timezone', '004'),
    ('challenges', 'last_attempt_at', '004'),
    ('challenge_outlines', 'keywords', '005'),
    ('challenge_outlines', 'guiding_question', '005'),
    ('attempts', 'unexplained_jargon', '005'),
    ('attempts', 'audio_issue', '005'),
    ('challenges', 'review_box', '006'),
    ('challenges', 'next_review_at', '006'),
    ('attempts', 'follow_up_questions', '006'),
    ('app_settings', 'ai_enabled', '007'),
    ('app_settings', 'ai_global_per_day', '007'),
    ('ai_usage', 'cost_units', '008'),
    ('ai_usage', 'prompt_tokens', '008'),
    ('ai_usage', 'output_tokens', '008'),
    ('ai_usage', 'thinking_tokens', '008'),
    ('ai_usage', 'latency_ms', '008')
),
expected_grants (tbl, from_migration) as (
  values
    ('attempts', '009'),
    ('attempt_followups', '009'),
    ('challenges', '009'),
    ('ai_usage', '009')
)

-- 1. Tabel ada?
select
  '1. tabel' as bagian,
  e.name as item,
  case when t.tablename is null then 'KURANG' else 'OK' end as status,
  e.from_migration as migrasi
from expected_tables e
left join pg_tables t
  on t.schemaname = 'public' and t.tablename = e.name

union all

-- 2. RLS aktif? (tanpa ini data user bisa dibaca siapa saja)
select
  '2. RLS aktif',
  e.name,
  case
    when c.relname is null then 'KURANG (tabel tidak ada)'
    when c.relrowsecurity then 'OK'
    else 'BAHAYA: RLS MATI'
  end,
  e.from_migration
from expected_tables e
left join pg_class c
  on c.relname = e.name
 and c.relnamespace = 'public'::regnamespace

union all

-- 3. Fungsi RPC ada?
select
  '3. fungsi',
  e.name,
  case when p.proname is null then 'KURANG' else 'OK' end,
  e.from_migration
from expected_functions e
left join pg_proc p
  on p.proname = e.name
 and p.pronamespace = 'public'::regnamespace

union all

-- 4. Kolom dari migrasi 004 sampai 006 ada?
select
  '4. kolom',
  e.tbl || '.' || e.col,
  case when c.column_name is null then 'KURANG' else 'OK' end,
  e.from_migration
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.tbl
 and c.column_name = e.col

union all

-- 5. Bucket rekaman: harus ada, PRIVAT, dan dibatasi 10 MB
select
  '5. storage',
  'bucket recordings',
  case
    when b.id is null then 'KURANG'
    when b.public then 'BAHAYA: BUCKET PUBLIK'
    when b.file_size_limit is distinct from 10485760 then 'OK (batas ukuran beda)'
    else 'OK'
  end,
  '002 + 003'
from (select 1) dummy
left join storage.buckets b on b.id = 'recordings'

union all

-- 6. Maintenance boleh MEMBACA tabel yang dibutuhkannya (dan hanya membaca)
select
  '6. hak service_role',
  'select ' || e.tbl,
  case
    when to_regclass('public.' || e.tbl) is null then 'KURANG (tabel tidak ada)'
    when not has_table_privilege('service_role', 'public.' || e.tbl, 'SELECT') then 'KURANG'
    else 'OK'
  end,
  e.from_migration
from expected_grants e

order by bagian, item;
