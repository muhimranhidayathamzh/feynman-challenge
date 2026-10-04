-- ---------------------------------------------------------------------------
-- 009_maintenance_access.sql — hak baca untuk pembersihan storage (Prompt 4.2).
--
-- Di project ini, role service_role tidak mendapat hak apa pun atas tabel di
-- skema public (tabel dibuat lewat SQL Editor, dan hak bawaan Supabase tidak
-- memberinya ke service_role). Auth admin dan Storage tetap jalan, jadi hapus
-- akun tidak terdampak: cascade dari auth.users dijalankan database sendiri.
--
-- Yang terhalang hanya `npm run maintenance` dan /api/cron/maintenance, yang
-- perlu MEMBACA tabel untuk tahu rekaman mana yang masih dirujuk dan kapan
-- akun demo terakhir aktif. Jadi hanya itu yang diberikan:
--
--   * SELECT saja, tidak pernah INSERT, UPDATE, atau DELETE;
--   * hanya empat tabel yang dibaca src/lib/maintenance/cleanup.ts.
--
-- Idempotent: GRANT yang sudah ada tidak berubah apa-apa.
-- ---------------------------------------------------------------------------

grant usage on schema public to service_role;

grant select on public.attempts          to service_role;
grant select on public.attempt_followups to service_role;
grant select on public.challenges        to service_role;
grant select on public.ai_usage          to service_role;
