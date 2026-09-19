# CLAUDE.md — Feynman Challenge

> Instruksi utama untuk Claude Code. Baca file ini sebelum mengerjakan apapun.

## Project Overview

**Feynman Challenge** — PWA yang membantu self-learner menguasai materi apapun lewat Feynman Technique: jelaskan ulang via audio → AI evaluasi.

Master spec: `docs/feynman_challenge_master.md`
Rencana perbaikan aktif: `prompts/improvement-plan.md` (3 fase, 16 prompt). Kerjakan berurutan; cek tabel Status di bagian bawah file itu.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Language | TypeScript strict — **zero `any`** |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Gemini 2.5 Flash via `@google/genai` (multimodal audio) |
| Audio | MediaRecorder API → WebM (Opus) |
| Styling | Vanilla CSS custom properties — **NO Tailwind, NO CSS-in-JS** |
| Validation | Zod 4 for all API I/O (`z.uuid()`, `z.iso.datetime()`, `z.url()`) |
| Font | Newsreader + Plus Jakarta Sans (`next/font/google`) |
| Hosting | Vercel |

## Architecture Rules

### Code Standards
- TypeScript strict mode. Zero `any`. No `@ts-ignore`.
- All API responses validated with Zod schemas.
- Server Components by default. `'use client'` only when needed (interactivity, hooks, browser APIs).
- Feature-based file structure (lihat master spec section 8).
- Conventional commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`, `chore:`.
- Unit test (Vitest) wajib untuk setiap logika murni di `src/lib/utils/`. File test di samping sumber: `*.test.ts`.
- Env dibaca lewat `src/lib/env.ts` (server) dan `src/lib/env.public.ts` (public), bukan `process.env.X!`.

### API Keys & Security
- `GEMINI_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` = **server-side only** (Next.js API Routes). Akses lewat `serverEnv()` dari `src/lib/env.ts`.
- Client hanya pakai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Semua database access via Supabase RLS — user hanya bisa akses data sendiri.

### Styling Rules
- **Baca `docs/design/DESIGN.md` sebelum menyentuh CSS, komponen, atau copy.** Arah visual: "Kertas & Kapur".
- **Vanilla CSS only**: pakai token dari `src/styles/tokens.css` (`--paper`, `--surface`, `--ink`, `--accent`, dst.), bukan nilai hardcoded.
- Tema: Kertas (terang) dan Papan Tulis (gelap), dipilih lewat cookie `theme` (Terang/Gelap/Ikuti sistem). Layar rekam selalu Papan Tulis (`data-mood="board"`).
- Dilarang: gradient dekoratif, glassmorphism/`backdrop-filter`, glow, warna ungu, font Inter, emoji di UI, merah untuk hasil belajar.
- Aksen vermilion hanya untuk satu aksi utama per layar dan tombol rekam.
- Font: Newsreader (judul, angka, bacaan) + Plus Jakarta Sans (antarmuka), lewat `next/font`.
- Mobile-first responsive. `npm run design:check` wajib hijau.

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

Setiap prompt selesai, jalankan:
```bash
npx tsc --noEmit        # Type check
npm run lint            # ESLint CLI (next lint sudah deprecated)
npm run format:check    # Prettier
npm run design:check    # Aturan desain + kontras token
npm test                # Vitest unit tests
npm run build           # Build check
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```
