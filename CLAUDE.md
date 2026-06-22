# CLAUDE.md — Feynman Challenge

> Instruksi utama untuk Claude Code. Baca file ini sebelum mengerjakan apapun.

## Project Overview

**Feynman Challenge** — PWA yang membantu self-learner menguasai materi apapun lewat Feynman Technique: jelaskan ulang via audio → AI evaluasi.

Master spec: `docs/feynman_challenge_master.md`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript strict — **zero `any`** |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Gemini 2.0 Flash (multimodal audio) |
| Audio | MediaRecorder API → WebM (Opus) |
| Styling | Vanilla CSS custom properties — **NO Tailwind, NO CSS-in-JS** |
| Validation | Zod for all API I/O |
| Font | Inter (Google Fonts) |
| Hosting | Vercel |

## Architecture Rules

### Code Standards
- TypeScript strict mode. Zero `any`. No `@ts-ignore`.
- All API responses validated with Zod schemas.
- Server Components by default. `'use client'` only when needed (interactivity, hooks, browser APIs).
- Feature-based file structure (lihat master spec section 8).
- Conventional commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`.

### API Keys & Security
- `GEMINI_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` = **server-side only** (Next.js API Routes).
- Client hanya pakai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Semua database access via Supabase RLS — user hanya bisa akses data sendiri.

### Styling Rules
- **Vanilla CSS only** — gunakan CSS custom properties dari design system.
- Dark mode default. Warna dari `globals.css` design system.
- Glassmorphism cards: `backdrop-filter: blur()` + border subtle.
- Accent color: `hsl(250, 85%, 65%)` (purple).
- Semua spacing, color, typography HARUS pakai CSS variables, bukan hardcoded values.
- Mobile-first responsive.

### Error Handling
- Semua API routes: try-catch dengan proper error responses.
- Client: loading states (skeleton), error states, retry logic.
- Gemini API: timeout handling (set `maxDuration: 60` di evaluate route).

### File Naming
- Components: `kebab-case.tsx` (e.g., `score-ring.tsx`)
- Utilities: `kebab-case.ts` (e.g., `mastery.ts`)
- Types: `index.ts` di `src/types/`
- API routes: `route.ts`

## Database Schema

6 tables: `profiles`, `challenges`, `challenge_outlines`, `challenge_sources`, `challenge_notes`, `attempts`.
Detail lengkap di master spec section 7. Semua table wajib RLS policies.

## Key Design Decisions

1. **STT = Gemini Multimodal** — audio langsung ke Gemini, bukan STT terpisah.
2. **Single API call** per evaluasi = transcript + scores + feedback sekaligus.
3. **Tiered hints** dengan score cap: no hint (10), keywords (9), questions (8), outline (7).
4. **Mastery state machine**: not_started → attempted → developing → proficient → mastered → solidified.
5. **Gentle accountability** — deadline system yang supportive, bukan punishing.

## Implementation Phases

Eksekusi berurutan. Jangan loncat phase.

1. **Foundation** — project init, design system (globals.css), Supabase setup, auth, layout shell
2. **Challenge System** — create challenge, Gemini outline generation, notebook page, CRUD APIs
3. **Audio Recording** — MediaRecorder wrapper, recording screen, waveform, hints, upload
4. **AI Evaluation** — Gemini multimodal API, evaluation prompt, results page, mastery logic
5. **Dashboard & Engagement** — home dashboard, streak, deadlines, challenge list
6. **Polish & PWA** — animations, responsive pass, service worker, manifest, README

## Verification

Setiap phase selesai, jalankan:
```bash
npx tsc --noEmit    # Type check
npx next lint        # Lint
npm run build        # Build check
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```
