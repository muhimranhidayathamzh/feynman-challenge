# Changelog

All notable changes to Feynman Challenge. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### End-to-end tests, ready for a test project (4.3)

- **`AI_MOCK=1`** returns fixed Gemini answers that pass the real Zod schemas, from the one function every AI call goes through. It refuses to run in production (tested), since a mocked score must never reach a learner.
- **Playwright** drives the main flow against a production build with a fake microphone: sign in, create, edit the outline, record 20 seconds, send, read the coverage, "Pelajari lagi" to the right point, the attempt history, a follow-up answer, and the offline page.
- **Guarded against the wrong database**: it needs a separate Supabase project (D12) in `.env.e2e`, refuses to start without one, and refuses if it is the project in `.env.local`. Both refusals were checked. A CI job runs it once the three secrets exist and is skipped until then.
- **Not run green yet**: no test project exists so far, so the scenario has been listed and type-checked but not executed end to end. That happens once the project is created.
- Sentry was already done in U.2. Bundle impact of this prompt: none on the client; the mock is server code behind a runtime flag.

### Review reminders by email (5.4)

- **The spaced-repetition schedule now calls people back.** A daily job emails each learner on the day a review falls due: what is due today, plus anything still waiting, with one button back to the app. At most once a day, only between 07:00 and 21:00 in their own timezone, never to demo accounts, and never again for a review they already ignored.
- **Opting out takes one click, without signing in**: a confirmation page (`/berhenti`) behind a signed link, so mail scanners that open links cannot unsubscribe anyone, plus the `List-Unsubscribe` one-click header for mail apps. Also a switch in Pengaturan.
- **Off until configured**: needs `RESEND_API_KEY`, `REMINDER_FROM` and `CRON_SECRET`. Until then the switch is hidden and `/privasi` does not mention Resend.
- **Migration 010** adds `review_reminders` and `last_reminded_on` to profiles, and lets `service_role` update only those two columns.
- Recipient selection, the sending window and the email itself are pure functions (`src/lib/utils/reminders.ts`, `unsubscribe-token.ts`), tested across four timezones, including a local date ahead of UTC. Titles are escaped in the HTML, since learners write them.

### Errors you do not see still get recorded (U.2)

- **Sentry, off until `NEXT_PUBLIC_SENTRY_DSN` is set.** Server errors (every API route's failure path now goes through `logError`, and Next.js's own `onRequestError`) and browser errors (unhandled errors and the error boundaries) are reported.
- **No personal data, proven rather than promised.** Sentry 11 collects request bodies, cookies, headers, local variables in stack frames, database query data and AI inputs and outputs by default; each is switched off, the AI and local-variable integrations are removed, and `scrubEvent` filters what remains (tested). Real reports sent from the server and from a browser to a local stand-in for Sentry carried no email, transcript, user or request body.
- **Tags**: `ai_kind`, `gemini_code`, and a coarse `latency` bucket.
- **Bundle cost, measured**: a first attempt grew the Edge middleware from 91.3 kB to 164 kB with monitoring *off*, because `instrumentation.ts` was bundled for Edge; rewriting the checks as build-time constants brought it back to 91.5 kB. With monitoring on, the first attempt lazily loaded 337 kB gzip of SDK; named imports and the plain browser SDK cut that to about 30 kB, after the page, with the first load unchanged.
- `/privasi` names Sentry as a processor only when it is configured.

### Strangers welcome, abusers not (5.1)

- **Per-IP rate limit on every API route that writes or calls the AI**: AI routes 20 a minute, saves 120 a minute, password checks and sign-in callbacks 20 per ten minutes, answered with `429` and `Retry-After`. A sliding window in memory per instance (`src/lib/utils/rate-limit.ts`, tested). The client address is trusted only from Vercel's edge; elsewhere a forged `x-forwarded-for` buys nothing.
- **Cloudflare Turnstile**, off until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. The plan named sign-up and the demo button, but Supabase asks for a token on every auth call once CAPTCHA is on, so the widget is also on sign-in (including "resend confirmation"), password reset, and the password check before account deletion; otherwise switching it on would have locked everyone out. On the demo button it appears only after the click and continues on its own. Tokens are single-use, so every failed attempt fetches a new one.
- Checked both ways in the browser with Supabase intercepted: without a key every flow sends no token and works as before; with Cloudflare's test key every flow sends one.
- The sign-up confirmation now mentions the spam folder, and the note under "Coba tanpa akun" no longer promises a prepared example that V.9 removed.

### Privacy and terms in plain language (5.2)

- **`/privasi`** says what is stored and why, that recordings and topics go to Google Gemini, who else processes data (Supabase, Vercel, Google), how long each thing is kept, the rights under Indonesia's personal data law (UU 27/2022), and how to delete everything. **`/syarat`** is short: AI scoring can be wrong and is not for important decisions, your content stays yours, fair use, and Indonesian law.
- **The Gemini paragraph follows the facts of the deployment.** On the free tier Google may use what is sent to improve its products and human reviewers may read it; on a billed key it does not. `GEMINI_PAID_TIER=1` switches the page to the paid-tier wording; until then it states the free-tier terms and asks people not to say personal details in their recordings.
- **One honest sentence where it matters**: before every recording ("Rekamanmu dikirim ke Google Gemini untuk dinilai, dan bisa kamu hapus kapan saja") and on the sign-up form. The recording screen used to say recordings were "only used to judge your explanation", which the free tier does not guarantee.
- Linked from the landing footer, sign-up, and Pengaturan; public without signing in and listed in the sitemap. `CONTACT_EMAIL` sets where privacy requests go.

### Delete your account, and storage that stays clean (4.2)

- **"Zona berbahaya" in Pengaturan deletes the account.** Type HAPUS, plus the password for email accounts (Google and demo accounts have none to give). Every recording is removed first and the account second, so if the files cannot be removed the account stays and the learner can try again. Afterwards the app clears its caches and lands on the sign-in page with a confirmation.
- **`npm run maintenance`** finds recordings nothing points at (older than 24 hours) and anonymous demo accounts idle for seven days. It is a dry run unless given `--apply`, and prints counts and sizes only. Files of unknown age are never deleted.
- **Migration 009** gives `service_role` read-only access to the four tables maintenance reads. The first dry run against the real project showed this role had no table privileges at all, so the job could not tell which recordings were still in use. Account deletion was never affected: it only needs Auth and Storage.
- **Optional daily run on Vercel**: `/api/cron/maintenance`, scheduled in `vercel.json`, refuses every request until `CRON_SECRET` is set.
- The decisions (confirmation, orphans, idle accounts, who must give a password) are pure functions in `src/lib/utils/account-cleanup.ts`, tested; the storage work is shared by the route, the cron and the script in `src/lib/maintenance/cleanup.ts`.

### Every attempt can be opened again (4.1)

- **"Riwayat percobaan" in the notebook**: one line per attempt, newest first, with the day in the learner's own timezone ("Hari ini", "Kemarin", "21 Sep"), the hint used, and the score ("7 /10") or what happened instead ("Sedang dinilai", "Penilaian gagal", "Tidak bisa dinilai"). Each line opens that attempt's result. The last ten show; "Tampilkan semua" reveals the rest.
- **Attempts that never finished are reachable.** An attempt still being judged, or whose judging failed, opens like any other, and its page resumes or retries the evaluation as before.
- **Coverage trend dots are links** to the attempt they stand for, each named for screen readers ("Percobaan #2: tercakup").
- **The result page steps to the previous and next attempt**, beside "Percobaan #N", and under the card on the judging, failed and unscorable screens.
- Logic in `src/lib/utils/attempt-history.ts`, tested; checked at 360, 390 and 1280 px in both themes, by keyboard, and with a screen-reader tree dump.

### Every learning source opens something

- **Source titles are always clickable.** The AI is told never to invent a URL, so most suggested sources arrived without one and their titles could not be opened, which looked like a bug. A title now opens the source's own page when it has a real http(s) URL, and otherwise a search for that title: YouTube for videos, Google Scholar for papers, Google for the rest. The small print says which ("Video · cari di YouTube"), so a search is never passed off as the page itself, and screen readers hear "membuka pencarian". Applied in the notebook and in the plan preview when creating a challenge (`src/lib/utils/source-link.ts`, tested).

### A landing that lets visitors feel the problem (V.10)

Three rounds of landing revisions each fixed a fragment while the approach stayed wrong: the page explained the product instead of the visitor's problem. A concept study ([`docs/design/landing-konsep.html`](docs/design/landing-konsep.html)) started from the visitor instead, and this rebuild follows its recommendation.

- **A ten-second test opens the page.** One large question about an everyday mechanism ("Bagaimana resleting bekerja?"), answered in the visitor's head. An ink line fills for ten seconds, then: "Tersendat? Kamu tidak sendirian." The primary action is visible from the first second and never waits. The question changes per visit, from a list of five that includes items from the original study.
- **The problem gets its name**: the illusion of explanatory depth, from Rozenblit and Keil at Yale (2002), where people lowered their own rating of how well they understood zippers and locks after trying to explain them.
- **A corrected paragraph shows how the product reads an explanation**, with the result page's own marks and meanings: the highlighter for quoted evidence, the dotted underline for an unexplained term, the partial and missing verdicts, and "Fokus berikutnya". It is about the feeling of understanding itself, so it needs no example topic.
- Then the three steps, a safety section answering the biggest hesitation (speaking out loud), and a close at the board that asks the opening question again.
- Honest by construction: no testimonials, user counts, countdown pressure or scarcity; the one study cited is real.
- Verified across all five questions, six screen sizes and both themes (60 combinations), including the ten-second timing and reduced motion. Lighthouse, median of three runs: mobile 84, desktop 100, accessibility 100.

### A plain landing, and "Coba tanpa akun" on your own topic (V.9)

- **No example topic anywhere a visitor looks.** The owner wants people to meet the product on their own topic. The landing keeps the recording stage as its picture of the product, drawn from the stage's own components with no content in it, and the interactive evidence demo gives way to an explanation of how a result reads: the three verdicts, the highlighter, the dotted underline for unexplained terms, and how the score is computed.
- **"Coba tanpa akun" opens "Tantangan baru"** after the anonymous sign-in, instead of a prepared challenge. The seeding endpoint (`/api/demo/seed`), its code and its schema are removed rather than left idle: an unused endpoint that writes to the database is attack surface for nothing.
- The hero's stage now shows a recording in progress: the recording dot, the clock, the chalk line and the record button. The three hint chips it showed before ("maks 9, maks 8, maks 7") needed context a first-time visitor does not have, and without the record button the picture never said "you talk here".
- Trying the demo now makes real AI calls, bounded by the anonymous quota and the app-wide daily ceiling.
- The sample data stays, but only for the dev screen gallery and the screenshots made from it.
- Lighthouse on the landing, median of three runs: mobile 84 (was 74 with the interactive demo), desktop 100, accessibility 100.

### A landing page for a product (V.8)

- **The demo is about compound interest now, not photosynthesis.** The first example every visitor meets sets who the product is for, and a school biology topic said "for students". The demo challenge, its outline, sources (both checked to exist), notes, transcript, evaluation and follow-up questions are rewritten, and the landing, the "Coba tanpa akun" challenge and every gallery screen follow from the same fixture. `src/lib/demo/fixture.test.ts` now proves every quoted piece of evidence appears word for word in the transcript, so an edit can never silently break a highlight in public.
- **The landing is rebuilt as a product page**: a top bar, a split hero (the promise and the call to action beside the chalkboard stage), how it works, an interactive evidence demo built from the result page's own component (choose a point and its quote lights up), the review schedule, why explaining works, questions that usually hold people back, and a closing call at the board. Every claim was checked against the code; nothing promises a feature that does not exist yet.
- Below-the-fold load animations are skipped on the landing; they played before anyone could see them.
- `design:check` no longer mistakes ©, ® and ™ for emoji. They are Extended_Pictographic in Unicode but render as text; real emoji are still rejected.
- Lighthouse, median of three runs: landing mobile 74, desktop 99, accessibility 100.

### Second look at five screens (V.7)

A fresh review of the redesigned app found five screens whose content was right but whose presentation was not. No database changes.

- **Result page**: 4,051 px on a phone, with "Jelaskan lagi" at the very bottom. The one thing to work on next is now pulled up under the score as "Fokus berikutnya", the full evaluator notes and the comparison with the previous attempt fold into sheets whose summary line stays readable while closed, and "Jelaskan lagi" sticks above the bottom nav. The points beside the highlighted transcript are unchanged.
- **New challenge**: topic suggestions for an empty field, an everyday example instead of "Quantum Entanglement", an honest note that a missed deadline is extended once, a primary button that is never a dead grey block, and validation shown under the field. Keyboard focus returns to the field after a suggestion is chosen.
- **Notebook**: the header shows only title, mastery, deadline and next review. Review boxes, reschedule, park, complete, rename and delete fold into "Kelola tantangan".
- **Landing and onboarding**: both used three identical illustrated cards, which DESIGN.md §12 bans. The landing now walks through the loop beside real fragments of the app rendered from the demo data: the outline, the chalkboard stage (built from the stage's own components), and a result with its highlighted evidence. Onboarding is a numbered list whose first action clears the bottom nav on common phones.
- **Meja Belajar**: the header flame badge is gone (§10 says the week strip replaces it; both counted the same days), labels are sentence case, and the mastery meter in the list is large enough to read.
- Lighthouse on the landing: accessibility still 100. (An earlier version of this entry claimed performance rose from 78 to 85; both were single runs, and later medians of three runs showed a single mobile run varying by up to eight points, so the claim is withdrawn.)

### Getting ready for the public (Fase 5, in progress)

- **Cost brakes that need no deployment**: migration 007 adds `app_settings` with an app-wide AI kill switch and a daily ceiling, both checked inside `consume_ai_quota`. Per-user quota was the wrong unit for a public site, where anonymous accounts are free to mint. The four AI routes now answer 503 for an app-wide brake and 429 only when a learner hit their own limit.
- **Link previews**: `metadataBase`, Open Graph and Twitter cards, `robots.txt` and a sitemap. The preview image is a page rendered with the app's own tokens and fonts (`npm run og`), so it cannot drift from the design.
- **Indexing is opt-in**: without `NEXT_PUBLIC_ALLOW_INDEXING`, `robots.txt` disallows everything and pages carry `noindex`, so a test deployment cannot reach search results.
- **Landing hierarchy fixed**: "Coba tanpa akun" is the action the page wants and was rendered as the weakest element on screen; it is now the single accented action.
- **Documentation**: `supabase/verify.sql` checks that every migration landed, `docs/README.md` maps the documentation, and the repository finally carries the MIT `LICENSE` its README always claimed.

### Visual overhaul: "Kertas & Kapur" (Fase V)

A full redesign of the interface, planned in `docs/design/DESIGN.md` and audited in `docs/design/audit.md`. No database changes.

- **Two moods**: a warm paper light theme for reading and studying, and a chalkboard dark theme. The recording screen is always chalkboard. The theme is chosen in Pengaturan (Terang / Gelap / Ikuti sistem) and stored in a cookie, so the server renders it without a flash.
- **Typography and tokens**: Newsreader for headings, numbers and prose, Plus Jakarta Sans for the interface. Colour, space, and type tokens were rebuilt and every pair is contrast-checked (AA) by `npm run design:check`, which also bans gradients, glass, glow, purple, and emoji in the UI.
- **Result page**: the verdict is read first as a sentence, then the score, then the points. The transcript is annotated, and clicking a point scrolls to the evidence for it and back.
- **Recording stage**: a full chalkboard with a large clock, calmer waveform, and hints that state the score cap they cost.
- **Notebook**: reading-first layout, sources as a bibliography, outline editing behind an "Ubah" toggle, mastery and review state in the header.
- **Meja Belajar**: the dashboard now opens with one action for today, a week strip instead of a streak badge, and the rest of the challenges as an index.
- **Public landing page**: signed-out visitors see what the app does, three steps, and a real sample evaluation, instead of a login form.
- **Screen gallery**: `/dev/galeri` renders 24 screens and states with fixed data (404 in production), and `npm run shots` photographs them at 390 and 1280 px in both themes.

## [1.0.0] - 2026-09-19

The first release after the 3-phase improvement plan in `prompts/improvement-plan.md`. Run migrations **003 to 006** on an existing database before deploying (see README, "Database").

### Phase 1: Stabilise

- **Safety net**: Vitest unit tests for all pure logic, validated environment variables, ESLint CLI, Prettier, and GitHub Actions CI.
- **Direct upload**: recordings go from the browser straight to a private Storage bucket. Deleting a challenge also deletes its audio.
- **Reliable evaluation**: atomic claim and finalize RPCs, overall score computed on the server, Gemini calls with timeouts and retry, and a per-user AI quota enforced in SQL.
- **Resilient client**: shared API contracts, polling for in-progress evaluations, JSON 401s, and notes that flush before leaving the page.
- **Time done right**: every "today" is computed in the user's timezone. Deadlines are calendar days, and auto-extension, mastery slip, and streak display are derived at read time.
- **AI quality**: hints generated per outline point, one coverage verdict per point with a quote as evidence, unexplained jargon, and rejection of audio that cannot be judged.

### Phase 2: Complete

- **Design system**: reusable UI primitives, tokens split into feature stylesheets, and contrast-checked colours.
- **Language and accessibility**: consistent Indonesian copy, focus management, skip link, live regions, and reduced-motion support.
- **Challenge lifecycle**: park, reactivate, complete, reschedule, and markdown notes with preview.
- **Recording**: listen before sending, and replay the recording on the result page.
- **Auth**: password reset, Google sign-in, safe `?next=` redirects, and a settings page (name, timezone, password).

### Phase 3: Differentiate

- **Spaced repetition**: Leitner boxes replace the 30-day decay, with a "Review Hari Ini" section on the dashboard.
- **Socratic coach**: 1–2 follow-up questions per evaluation, answered by voice and graded without touching the score.
- **Gap to source**: "Pelajari lagi" jumps from a weak point to the notebook, each outline point shows a 5-attempt coverage trend, and results compare every point with the previous attempt.
- **PWA**: PNG and maskable icons, shortcuts, screenshots, an offline page, and a rewritten service worker that never caches authenticated pages, versions its caches per build, clears them on logout, and offers "Versi baru tersedia".
- **Demo mode**: "Coba tanpa akun" with a seeded example challenge (no Gemini call), stricter anonymous quota, a demo banner, and conversion to a permanent account.
- **Docs**: README with architecture diagram, technical decisions, full setup, and Lighthouse results. Master spec updated to match the schema and quotas.

### Changed

- Gemini model is `gemini-2.5-flash` through `@google/genai`.
- `challenges.deadline` is a `date` and `extended_deadline` is gone (migration 004).

### Security

- Service-role and Gemini keys are server-only. Prompt input from users is fenced against injection.
- Login errors from the auth callback are fixed codes, never free text from the URL.
- The old service worker cached authenticated HTML. The new one removes those caches on activation.

## [0.1.0] - initial build

- Next.js 15 scaffold, design system, Supabase schema, notebook, recording, Gemini evaluation, dashboard, and a basic PWA.
