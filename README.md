# 🧠 Feynman Challenge

> _"Kalau kamu nggak bisa menjelaskannya, kamu belum paham."_
> A PWA that helps self-learners master any topic with the **Feynman Technique**: explain it out loud, and let AI evaluate how well you understood it.

> Screenshots coming with the portfolio pass (see `prompts/improvement-plan.md`, Prompt 3.5).

---

## ✨ What it does

You pick a topic. AI drafts a learning outline + sources. You study, then **record yourself explaining it**. The recording goes straight to Gemini (multimodal audio), which transcribes it and scores your explanation against the outline — comprehensiveness, accuracy, and clarity — with actionable feedback. Repeat to climb the mastery ladder.

### Features

- **AI learning plans** — generate an outline, suggested sources, and an adaptive recording duration from any topic.
- **Notebook** — editable outline (add / edit / reorder via drag or arrows), sources, and markdown notes with autosave.
- **Immersive recording** — circular countdown, real-time waveform (Web Audio), and **tiered hints** that cap your max score (none = 10 → keywords 9 → questions 8 → full outline 7).
- **Single-call AI evaluation** — audio → transcript + scores + per-topic coverage + feedback, in one Gemini request.
- **Mastery system** — `not_started → attempted → developing → proficient → mastered → solidified`, with 30-day decay.
- **Gentle accountability** — supportive deadline nudges and automatic +2-day extensions instead of punishment.
- **Dashboard** — streaks, "Due Soon", "Needs Review" (decay), and a grid of all challenges.
- **PWA** — installable, offline-capable, dark-mode-first.

---

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript (strict, zero `any`) |
| Database / Auth / Storage | Supabase (PostgreSQL + RLS, Auth, Storage) |
| AI | Google Gemini 2.5 Flash (`@google/genai`, multimodal audio) |
| Audio | MediaRecorder + Web Audio API → WebM/Opus (MP4 on Safari) |
| Validation | Zod 4 (all API & AI I/O) |
| Testing | Vitest (unit tests for all pure logic), GitHub Actions CI |
| Styling | Vanilla CSS custom properties — no Tailwind, no CSS-in-JS |
| Hosting | Vercel |

---

## 🏗️ Architecture

- **Route groups** — `(auth)` for the centered login/signup flow, `(app)` for the authenticated shell (header + responsive nav). The recording screen lives outside both for a full-screen, immersive experience.
- **Server-first** — pages are RSC that read data via a per-request Supabase server client; interactivity is isolated to small `"use client"` islands.
- **Security** — `GEMINI_API_KEY` and the service-role key are server-only. Every table is protected by **Row Level Security**, so users can only ever touch their own data; the Gemini client is `import "server-only"`.
- **One AI call per evaluation** — the audio is sent directly to Gemini with the outline as ground truth; structured JSON out, Zod-validated, then persisted and used to advance the mastery state machine.
- **Middleware** — refreshes the Supabase session and guards every non-public route.

```
src/
├── app/
│   ├── (auth)/                 # login, signup
│   ├── (app)/                  # dashboard + challenge notebook + results (shell)
│   ├── challenge/[id]/record/  # full-screen recorder
│   └── api/                    # challenge CRUD, generate, evaluate, attempt
├── components/                 # ui, layout, challenge, recording, evaluation, dashboard
├── lib/                        # supabase/, gemini/, audio/, auth/, utils/
└── types/                      # Database type + shared domain types
```

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier)
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
SUPABASE_SERVICE_ROLE_KEY=...      # server-only
GEMINI_API_KEY=...                 # server-only
```

### 4. Database
In the Supabase SQL Editor, run the migrations in order (each is idempotent):
1. `supabase/migrations/001_initial_schema.sql` — 6 tables, RLS policies, profile + updated_at triggers.
2. `supabase/migrations/002_storage.sql` — private `recordings` bucket + storage policies.
3. `supabase/migrations/003_pipeline.sql` — bucket limits, atomic evaluation claim/finalize, per-user AI quota.
4. `supabase/migrations/004_time_and_state.sql` — user timezone, `deadline` as a date, `last_attempt_at`.
5. `supabase/migrations/005_ai_quality.sql` — AI hints per outline point, jargon, unscorable-audio handling.

### 5. Authentication (Supabase dashboard)
- **Redirect URLs** (Authentication > URL Configuration): add `http://localhost:3000/api/auth/callback` and your production `https://<domain>/api/auth/callback`. Email confirmation, password recovery, and OAuth all land there.
- **Minimum password length** (Authentication > Providers > Email): set it to **8** to match the client-side rule in `src/lib/auth/password.ts`.
- **Login Google (optional):**
  1. Google Cloud Console > APIs & Services > Credentials > *Create OAuth client ID* (type *Web application*).
  2. Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
  3. Supabase > Authentication > Providers > Google: enable it and paste the client ID and secret.
  Without this, the "Masuk dengan Google" button shows a friendly "not enabled" message.

### 6. Run
```bash
npm run dev      # http://localhost:3000
```

---

## ✅ Verification

```bash
npx tsc --noEmit        # type check (strict)
npm run lint            # ESLint
npm run format:check    # Prettier
npm test                # Vitest unit tests
npm run build           # production build
```

The same checks run in CI on every push (`.github/workflows/ci.yml`).

---

## 🗺️ Roadmap

Ongoing improvements are tracked in [`prompts/improvement-plan.md`](prompts/improvement-plan.md): three phases (stabilise, complete, differentiate) with a status table at the bottom.

---

## 📄 License

MIT — built as a portfolio project.
