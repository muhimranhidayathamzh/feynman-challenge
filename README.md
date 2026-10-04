# 🧠 Feynman Challenge

<p align="center">
  <a href="https://github.com/muhimranhidayathamzh/feynman-challenge/actions/workflows/ci.yml"><img src="https://github.com/muhimranhidayathamzh/feynman-challenge/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <img src="https://img.shields.io/badge/TypeScript-strict,%20zero%20any-3178C6" alt="TypeScript strict, zero any" />
  <img src="https://img.shields.io/badge/tests-213%20passing-2b7148" alt="213 unit tests passing" />
  <img src="https://img.shields.io/badge/a11y-Lighthouse%20100-2b7148" alt="Lighthouse accessibility 100" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-c8431b" alt="MIT license" /></a>
</p>

> _"Kalau kamu nggak bisa menjelaskannya, kamu belum paham."_
> A PWA that helps self-learners master any topic with the **Feynman Technique**: explain it out loud, and let AI tell you exactly which parts you really understood.

<p align="center">
  <img src="docs/design/shots/after/dashboard-isi-390-light.png" alt="Meja Belajar on a phone: one action for today" width="250" />
  <img src="docs/design/shots/after/rekam-merekam-390-light.png" alt="The recording stage: a chalkboard with a large clock" width="250" />
  <img src="docs/design/shots/after/hasil-selesai-390-light.png" alt="A result: summary, score, points and the annotated transcript" width="250" />
</p>

**Try it without an account:** the landing page has a **"Coba tanpa akun"** button (demo mode) that signs you in anonymously and takes you straight to creating a challenge on a topic of your own. No email needed; these accounts get a tighter AI quota.

---

## ✨ What it does

You pick a topic. AI drafts a learning outline and sources. You study, then **record yourself explaining it**. The recording goes straight to Gemini (multimodal audio), which transcribes it and grades it against your outline: comprehensiveness, accuracy, and clarity, with per-point coverage and quotes from what you actually said. Then the app tells you what to study next and when to come back.

### Features

- **AI learning plans**: outline, suggested sources, and a recording length sized to the topic.
- **Notebook**: editable outline (drag or arrows), sources, and markdown notes with autosave and preview. Each outline point shows a **coverage trend** of your last 5 attempts, and every attempt, finished or not, stays one tap away in the **attempt history**.
- **Immersive recording**: countdown, live waveform, pause/resume, listen-before-send, and **tiered hints** generated per outline point that cap the maximum score (none 10, keywords 9, guiding questions 8, outline 7).
- **Trustworthy evaluation**: one Gemini call returns transcript, sub-scores, one coverage verdict per outline point with a quote as evidence, and unexplained jargon. The overall score is computed on the server. Unusable audio (silence, noise, wrong language) is rejected without a score.
- **Close the gap**: every partial or missing point has **"Pelajari lagi"**, which opens the notebook at that point. The result page compares each point with your previous attempt: improved, declined, still weak.
- **Socratic coach**: 1–2 follow-up questions aimed at your weakest point, answered by voice and graded (tepat / sebagian / keliru). Answers never change your score.
- **Spaced repetition**: Leitner boxes (1, 3, 7, 14, 30, 60 days) decide when each topic comes back. Mastery climbs `not_started → attempted → developing → proficient → mastered → solidified` and slips a level if a review is badly overdue.
- **Gentle accountability**: deadlines are calendar days in your timezone, missed ones auto-extend once, and streaks count real completed evaluations.
- **Demo mode**: anonymous sign-in straight into creating a challenge on your own topic, a stricter AI quota, and a one-step path to keep the account (link an email, then set a password).
- **Four layers of cost control**: a per-user AI quota enforced atomically in SQL, tighter limits for demo accounts, an app-wide daily ceiling, and a kill switch — the last two flipped from the SQL editor with no redeploy.
- **Plain-language privacy and terms**: `/privasi` and `/syarat` say what is stored, that recordings go to Google Gemini, how long things are kept, and how to delete them. The recording screen and the sign-up form repeat the one sentence that matters.
- **Your data, deletable**: deleting the account removes every recording first and then the account, whose rows follow by cascade. A maintenance job clears recordings nothing points at and demo accounts idle for a week.
- **Installable PWA**: maskable icons, shortcuts, an offline page, and a service worker that never caches private pages.
- **"Kertas & Kapur" interface**: a warm paper light theme for studying and a chalkboard dark theme for the recording stage, in Newsreader and Plus Jakarta Sans. One action per screen, evidence before numbers, and never red for a learning gap. The rules live in [`docs/design/DESIGN.md`](docs/design/DESIGN.md) and are enforced by `npm run design:check`.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Browser
        R[Recorder<br/>MediaRecorder] -->|1. upload audio<br/>signed-in user, RLS| ST
        R -->|2. create attempt| API
        RES[Result page] -->|3. POST /api/evaluate| API
        SW[Service worker<br/>static assets + /offline only]
    end

    subgraph Vercel["Next.js on Vercel (server only)"]
        API[API routes<br/>Zod-validated]
        Q[consume_ai_quota]
        G[Gemini client<br/>timeout + retry]
    end

    subgraph Supabase
        ST[(Storage<br/>private recordings bucket)]
        DB[(Postgres + RLS)]
        CL[claim_attempt_evaluation]
        FIN[finalize_attempt_evaluation]
    end

    API -->|4. atomic claim| CL
    API -->|5. per-user quota| Q
    Q --- DB
    API -->|6. download audio| ST
    API --> G
    G -->|7. audio + outline<br/>structured JSON| GEM[Gemini 2.5 Flash]
    API -->|8. one transaction:<br/>attempt, mastery, review, streak| FIN
    CL --- DB
    FIN --- DB
```

- **Server-first**: pages are React Server Components reading through a per-request Supabase client. Interactivity lives in small `"use client"` islands.
- **Security**: `GEMINI_API_KEY` and the service-role key are server-only (`src/lib/env.ts`). Every table has Row Level Security. Model output is validated with Zod, and user text inside prompts is fenced against prompt injection.
- **Middleware**: refreshes the session, guards private routes, and only allows same-origin `?next=` redirects.

```
src/
├── app/
│   ├── (auth)/                 # login, signup, password reset
│   ├── (app)/                  # dashboard, notebook, results, settings
│   ├── challenge/[id]/record/  # full-screen recorder
│   ├── offline/                # service-worker fallback (static, no user data)
│   └── api/                    # challenge CRUD, generate, evaluate, follow-ups
├── components/                 # ui, layout, auth, challenge, recording, evaluation, dashboard
├── lib/                        # supabase/, gemini/, ai/, auth/, demo/, pwa/, storage/, utils/
├── styles/                     # design tokens + feature stylesheets (vanilla CSS)
└── types/                      # Database types + shared domain types
```

---

## 🧭 Technical decisions

| Decision | Why |
|---|---|
| **Gemini multimodal instead of a separate speech-to-text service** | One request returns transcript and grading together. It hears hesitation and self-corrections, handles Indonesian well, and costs nothing on the free tier. |
| **Direct browser upload to Storage** | The audio never passes through a serverless function, so there is no 4.5 MB body limit and no double transfer. The API only receives a path it verifies belongs to the user. |
| **Transactional RPCs for evaluation** | `claim_attempt_evaluation` prevents double evaluation from retries or two tabs. `finalize_attempt_evaluation` writes the attempt, mastery, review schedule, and streak in one transaction, so a crash can never leave them out of sync. |
| **Score computed on the server** | Gemini returns sub-scores only. The weighted overall score and the hint cap are applied in code (`src/lib/utils/scoring.ts`), so the model cannot drift the formula. |
| **Deadlines as calendar days + user timezone** | "Today" is always computed in the learner's IANA timezone. Auto-extension and streak display are derived at read time instead of being stored and going stale. |
| **Spaced repetition over time decay** | Leitner boxes schedule the next review from performance. Early reviews do not earn promotions, so "solidified" really means spaced, successful recall. |
| **Quota in SQL** | `consume_ai_quota` counts calls atomically, so concurrent requests cannot slip past the limit. Anonymous demo accounts get tighter limits. |
| **The emergency brake lives in SQL, not in env vars** | Per-user quota is the wrong unit for a public site: anonymous sign-in means accounts are free to mint. `app_settings` holds an `ai_enabled` switch and a daily ceiling read inside `consume_ai_quota`, so spend can be stopped in one `UPDATE`, with no deployment. The global count deliberately skips a global lock — a small overshoot on a cost guard beats serialising every AI call. |
| **Network-only navigations in the service worker** | Authenticated HTML is never cached, so a shared device cannot show a previous user's data offline. Caches are versioned per build and wiped on logout. |

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is enough)
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 2. Install
```bash
npm install
```

### 3. Environment
Copy `.env.local.example` to `.env.local` and fill in:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # server-only: account deletion and maintenance
GEMINI_API_KEY=...                 # server-only
CRON_SECRET=...                    # server-only, optional: guards /api/cron/*
GEMINI_PAID_TIER=                  # "1" only once the Gemini key is billed (see below)
CONTACT_EMAIL=...                  # shown on /privasi and /syarat for privacy requests
NEXT_PUBLIC_TURNSTILE_SITE_KEY=    # optional: Cloudflare Turnstile CAPTCHA (see Protection)

NEXT_PUBLIC_SITE_URL=...           # canonical origin, for Open Graph and the sitemap
NEXT_PUBLIC_ALLOW_INDEXING=        # leave empty; "1" only for the real launch
```

`GEMINI_PAID_TIER` changes what `/privasi` promises. On Gemini's free tier Google may use what is sent, recordings included, to improve its products, and human reviewers may read it; on a billed key it does not. Until the variable is `1` the page states the free-tier terms and asks people not to say personal details in their recordings.

Indexing is opt-in. While `NEXT_PUBLIC_ALLOW_INDEXING` is empty, `robots.txt` serves `Disallow: /` and every page carries `noindex`, so a test deployment cannot end up in search results.

### 4. Database
In the Supabase SQL Editor, run every migration **in order**. Each one is idempotent.

| Migration | Adds |
|---|---|
| `001_initial_schema.sql` | 6 core tables, RLS policies, profile and `updated_at` triggers |
| `002_storage.sql` | Private `recordings` bucket and storage policies |
| `003_pipeline.sql` | Bucket limits, atomic evaluation claim/finalize, per-user AI quota |
| `004_time_and_state.sql` | User timezone, `deadline` as a date, `last_attempt_at` |
| `005_ai_quality.sql` | AI hints per outline point, unexplained jargon, unscorable-audio handling |
| `006_learning_loop.sql` | Spaced repetition (`review_box`, `next_review_at`), follow-up questions and answers |
| `007_public_safety.sql` | `app_settings`: app-wide AI kill switch and daily ceiling, checked inside `consume_ai_quota` |
| `008_ai_cost.sql` | Weighted ceiling (cost units instead of calls) and per-call token and latency accounting |
| `009_maintenance_access.sql` | Read-only (`SELECT`) access for `service_role` on the four tables the maintenance job reads |

Then run [`supabase/verify.sql`](supabase/verify.sql) in the same editor. It is read-only and prints one row per table, RLS policy, function, column, bucket setting and grant, each marked OK or missing, so a half-applied migration cannot go unnoticed.

To stop all AI spend at any time, with no deployment:

```sql
update public.app_settings set ai_enabled = false where id = 1;        -- brake on
update public.app_settings set ai_global_per_day = 50 where id = 1;    -- or lower the ceiling
```

### What a call actually costs

The ceiling is spent in **cost units**, not calls, because the calls are not comparable: `evaluate` sends minutes of audio, `hints` sends a few lines of text. The weights live in [`src/lib/ai/usage.ts`](src/lib/ai/usage.ts) and are passed to SQL, so the two cannot drift apart.

Every call records its own token counts and latency, never any prompt, transcript or audio. Once a few days of real use have accumulated, derive the ceiling from the data instead of from intuition:

```sql
select kind,
       count(*)                        as calls,
       round(avg(prompt_tokens))       as avg_prompt_tokens,
       round(avg(output_tokens))       as avg_output_tokens,
       round(avg(thinking_tokens))     as avg_thinking_tokens,
       round(avg(latency_ms))          as avg_ms,
       sum(cost_units)                 as units
from public.ai_usage
where created_at > now() - interval '7 days'
group by kind
order by units desc;
```

Multiply the token averages by the current Gemini price list to get the real cost per evaluation, then set `ai_global_per_day` to the daily spend you are willing to carry.

### 5. Authentication (Supabase dashboard)
- **Redirect URLs** (Authentication > URL Configuration): add `http://localhost:3000/api/auth/callback` and `https://<your-domain>/api/auth/callback`. Email confirmation, password recovery, OAuth, and the demo-account email link all land there.
- **Minimum password length** (Authentication > Providers > Email): set it to **8**, matching `src/lib/auth/password.ts`.
- **Google sign-in (optional)**:
  1. Google Cloud Console > APIs & Services > Credentials > *Create OAuth client ID* (type *Web application*).
  2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
  3. Supabase > Authentication > Providers > Google: enable it and paste the client ID and secret.
- **Demo mode (optional)**: Authentication > Sign In / Providers > enable **Allow anonymous sign-ins**. Turning on CAPTCHA protection is recommended, because anonymous accounts can be created without an email.

The sign-in and sign-up pages read these switches from Supabase and hide the Google and "Coba tanpa akun" buttons while they are off (cached for five minutes).

### 6. Run
```bash
npm run dev      # http://localhost:3000
```

### 7. Maintenance
```bash
npm run maintenance              # dry run: counts and sizes only
npm run maintenance -- --apply   # delete them
```
Removes recordings that no attempt or follow-up answer points at (older than 24 hours, so uploads in flight are safe) and anonymous demo accounts idle for seven days, together with their files. Files whose age Storage does not report are always kept.

> **Warning:** the script uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses every RLS policy. Run the dry run first and read the numbers before `--apply`. It prints counts and sizes only, never keys or content.

On Vercel the same job runs daily at 02:30 WIB through Vercel Cron (`vercel.json`), but only once `CRON_SECRET` is set: without it `/api/cron/maintenance` refuses every request.

---

## ✅ Testing and verification

```bash
npx tsc --noEmit        # type check (strict, zero any)
npm run lint            # ESLint
npm run format:check    # Prettier
npm run design:check    # design rules: no gradients/glass/glow, token contrast (AA)
npm test                # Vitest: every pure module in src/lib has tests beside it
npm run build           # production build
```

The same checks run in CI on every push (`.github/workflows/ci.yml`). The service worker is registered only in production builds, so test PWA behaviour with `npm run build && npm start`.

Other scripts: `npm run icons` regenerates the app icons after changing the mark, and `npm run og` re-photographs the link-preview card.

### Screen gallery (design work)

In development, `/dev/galeri` renders every screen and state (dashboard, notebook, recording, results, settings, dialogs) with fixed sample data, without Supabase. It returns 404 in production builds.

```bash
npm run dev                          # terminal 1
npm run shots -- --label before      # terminal 2: docs/design/shots/before/*.png at 390 and 1280 px
npm run og                           # terminal 2: public/og.png, the 1200x630 link preview
```

The link-preview card is itself a page (`/dev/og`) rendered with the app's own tokens and fonts, so it cannot drift from the design.

Design rules live in [`docs/design/DESIGN.md`](docs/design/DESIGN.md), and the latest audit in [`docs/design/audit.md`](docs/design/audit.md).

### Lighthouse

Measured on the public pages against a local production build (`npm start`), Lighthouse 12. Performance is the **median of three runs**: on the development machine a single mobile run varied by up to eight points, so one run is not a number worth publishing.

| Page | Performance (mobile) | Performance (desktop) | Accessibility | Best Practices | SEO (indexing on) |
|---|---|---|---|---|---|
| Landing (`/`) | 84 | 100 | 100 | 100 | 91 |
| Sign in (`/login`) | 88 | — | 100 | 100 | — |

Accessibility is 100 on both. Mobile performance is the simulated-slow-4G score; layout shift is 0. The landing opens with a ten-second test (explain an everyday mechanism in your head) rather than screenshots of the app; the reasoning is in [`docs/design/landing-konsep.html`](docs/design/landing-konsep.html).

SEO needs two readings. A default build scores **54**, on purpose: indexing is opt-in (see [Environment](#3-environment)), so every page says `noindex` and Lighthouse's heavily weighted "is crawlable" audit fails. With `NEXT_PUBLIC_ALLOW_INDEXING=1` the landing scores 91; the remaining point is lost because Next.js 15 streams `<meta name="description">` into the body for clients it does not recognise as crawlers, and Lighthouse 12 no longer identifies itself as one. Pages behind sign in were not measured.

### Before and after the visual redesign

Every screen was photographed from the dev gallery before Fase V and again after it: [`docs/design/shots/before`](docs/design/shots/before) and [`docs/design/shots/after`](docs/design/shots/after), at 390 px and 1280 px (the "after" set also in both themes).

| Before | After |
|---|---|
| <img src="docs/design/shots/before/hasil-selesai-390.png" alt="Result page before" width="230" /> | <img src="docs/design/shots/after/hasil-selesai-390-light.png" alt="Result page after" width="230" /> |
| <img src="docs/design/shots/before/catatan-390.png" alt="Notebook before" width="230" /> | <img src="docs/design/shots/after/catatan-390-light.png" alt="Notebook after" width="230" /> |

The findings that drove the change are listed in [`docs/design/audit.md`](docs/design/audit.md).

---

## 🛡️ Protection against abuse

Four layers, each answering a different question. None of them depends on another.

| Layer | Stops | Where |
|---|---|---|
| **App-wide brake** | The whole bill running away: a kill switch and a daily ceiling in weighted units, flipped from the SQL editor with no redeploy | `app_settings` (migrations 007, 008) |
| **Per-user quota** | One account burning the budget: AI calls per day and per minute, tighter for demo accounts, checked atomically in SQL | `consume_ai_quota` (003) |
| **Per-IP rate limit** | Floods from one address, signed in or not: AI routes 20 a minute, saves 120 a minute, password checks and sign-in callbacks 20 per ten minutes. Answers `429` with `Retry-After` | `src/lib/api/rate-limit.ts` |
| **CAPTCHA** | Scripts creating accounts: Cloudflare Turnstile on sign-up, sign-in, password reset, the demo button and the password check before account deletion | `src/components/auth/captcha.tsx` |

The rate limit is a sliding window in memory, per server instance. It only trusts the client address that Vercel's edge writes; anywhere else every request shares one key, so a forged header cannot buy a fresh allowance. Once traffic spreads across many instances, move it to a shared store (Upstash Redis).

**Turning CAPTCHA on** takes both halves:
1. Cloudflare dashboard > Turnstile > add a widget for your domain (mode *Managed*). Copy the site key and the secret key.
2. Supabase > Authentication > Attack Protection > enable CAPTCHA, provider Turnstile, paste the **secret** key.
3. Vercel: set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the **site** key and redeploy.

Do step 3 together with step 2: once Supabase requires a token, sign-in without the widget fails. With the variable empty, no widget renders and every form works as before. Cloudflare's test key `1x00000000000000000000AA` always passes, for trying it locally.

**Email confirmation** must be on before strangers sign up, or anyone can register with someone else's address: Supabase > Authentication > Sign In / Providers > Email > *Confirm email*. The sign-up form already says "Cek email kamu", and the link lands on `/api/auth/callback`.

---

## ☁️ Deploying

The app runs on Vercel with no extra configuration; everything below is set once.

1. **Import the repository** in Vercel. Next.js is detected automatically.
2. **Environment variables**: the ones from [Environment](#3-environment), including `CRON_SECRET` for the daily maintenance, plus `NEXT_PUBLIC_SITE_URL` once the domain is known. Only the two `NEXT_PUBLIC_` Supabase values reach the browser; the service-role and Gemini keys are read exclusively through `src/lib/env.ts`, which is guarded by `server-only`.
3. **Supabase → URL Configuration**: add `https://<your-domain>/api/auth/callback` to the redirect URLs, alongside the localhost one.
4. **Set the AI ceiling** for the audience you expect (`app_settings.ai_global_per_day`).
5. **Leave `NEXT_PUBLIC_ALLOW_INDEXING` empty** until the launch is real.

Supabase's free tier pauses a project after seven days without activity and keeps no backups, so a deployment meant to be used needs the paid tier. Its built-in email service is rate limited for testing only — password resets need custom SMTP before real users arrive.

---

## 🗺️ Roadmap

The plan of record is [`prompts/improvement-plan.md`](prompts/improvement-plan.md): every phase, the decisions behind it, and a status table. Phases 1–3 shipped as v1.0.0, phase V was the visual redesign, and **phase 5** collects the gates before a public launch — per-IP rate limiting and CAPTCHA, account deletion, privacy and terms, error monitoring. Phase 4 (attempt history, end-to-end tests, AI scoring consistency) follows the launch. Offline recording, push reminders, analytics and export remain in the backlog.

[`docs/README.md`](docs/README.md) maps the rest of the documentation. See [`CHANGELOG.md`](CHANGELOG.md) for what changed.

---

## 📄 License

MIT — see [`LICENSE`](LICENSE). Built as a portfolio project.
