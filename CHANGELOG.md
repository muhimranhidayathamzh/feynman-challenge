# Changelog

All notable changes to Feynman Challenge. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
