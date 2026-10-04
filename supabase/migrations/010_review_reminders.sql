-- ---------------------------------------------------------------------------
-- 010_review_reminders.sql — pengingat review lewat email (Prompt 5.4).
--
-- Leitner box menjadwalkan review 1, 3, 7, 14 hari lagi, tapi sampai sekarang
-- tidak ada yang memanggil orang kembali. Migrasi ini menyimpan dua hal:
--
--   * review_reminders: pengguna boleh mematikan pengingat (Pengaturan, atau
--     tautan berhenti di setiap email, tanpa login). Bawaan menyala.
--   * last_reminded_on: hari (zona waktu pengguna) email terakhir dikirim,
--     supaya tidak pernah lebih dari satu email sehari.
--
-- Pengirimnya /api/cron/reminders, memakai service_role. Seperti 009, haknya
-- sesempit mungkin: membaca profil, dan hanya MENGUBAH dua kolom di atas.
-- (challenges sudah boleh dibaca sejak 009.)
--
-- Idempotent: aman dijalankan berulang kali.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists review_reminders boolean not null default true,
  add column if not exists last_reminded_on date;

comment on column public.profiles.review_reminders is
  'Email reminder when a spaced review falls due. Off from Pengaturan or the unsubscribe link.';
comment on column public.profiles.last_reminded_on is
  'Calendar day (user timezone) of the last reminder email: at most one a day.';

grant select on public.profiles to service_role;
grant update (review_reminders, last_reminded_on) on public.profiles to service_role;
