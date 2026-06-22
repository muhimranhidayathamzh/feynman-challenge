# Feynman Challenge — Execution Plan untuk Claude Code

> Panduan step-by-step untuk eksekusi via vibe coding di Claude Code.
> Setiap phase punya prompt yang bisa langsung di-copy-paste.

---

## Sebelum Mulai: Setup

### 1. Siapkan Project Directory
```bash
mkdir feynman-challenge && cd feynman-challenge
```

### 2. Taruh File Referensi
```
feynman-challenge/
├── CLAUDE.md                          ← file instruksi Claude Code (sudah dibuat)
└── docs/
    └── feynman_challenge_master.md    ← master spec kamu
```

### 3. Setup Environment
- Buat project Supabase di supabase.com (free tier)
- Dapatkan Gemini API key di aistudio.google.com
- Siapkan `.env.local` dengan keys yang dibutuhkan

### 4. Buka Claude Code
```bash
claude
```
Claude Code akan otomatis membaca `CLAUDE.md` sebagai konteks.

---

## Strategi Vibe Coding yang Profesional

### Prinsip Utama
1. **Satu phase per session** — jangan gabung. Selesaikan, verify, baru lanjut.
2. **Verify sebelum lanjut** — setiap phase harus `tsc --noEmit` + `npm run build` clean.
3. **Iterasi dalam phase** — kalau ada yang kurang, perbaiki di phase yang sama.
4. **Jangan skip foundation** — Phase 1 (design system + auth) harus solid sebelum lanjut.

### Cara Ngasih Prompt ke Claude Code
- **Spesifik** — sebutkan file, fungsi, behavior yang diharapkan.
- **Referensikan spec** — "sesuai section 7 di docs/feynman_challenge_master.md".
- **Satu scope per prompt** — lebih baik 3 prompt kecil daripada 1 prompt raksasa.
- **Review output** — cek hasil, minta revisi kalau perlu sebelum lanjut.

---

## PHASE 1: Foundation

### Prompt 1.1 — Project Init + Design System
```
Inisialisasi project Next.js 15 dengan App Router dan TypeScript strict.

Lakukan:
1. npx create-next-app@latest dengan TypeScript, ESLint, App Router (TANPA Tailwind)
2. Konfigurasi tsconfig.json strict mode
3. Buat src/app/globals.css dengan design system lengkap sesuai section 9 di docs/feynman_challenge_master.md:
   - CSS custom properties untuk semua warna (dark mode default)
   - Typography scale dengan Inter font
   - Glassmorphism card styles
   - Button variants (primary, secondary, ghost)
   - Animation keyframes
   - Responsive breakpoints
   - Utility classes yang dibutuhkan
4. Setup .env.local.example

Referensi warna dan design principles ada di master spec section 9.
Jangan pakai Tailwind atau CSS-in-JS apapun.
```

### Prompt 1.2 — Supabase + Database
```
Setup Supabase integration dan database schema.

Lakukan:
1. Install @supabase/supabase-js dan @supabase/ssr
2. Buat supabase/migrations/001_initial_schema.sql dengan SEMUA 6 tabel:
   - profiles (extends auth.users via trigger)
   - challenges
   - challenge_outlines
   - challenge_sources
   - challenge_notes
   - attempts
   Lengkap dengan RLS policies. Detail schema di master spec section 7.
3. Buat src/lib/supabase/client.ts (browser client)
4. Buat src/lib/supabase/server.ts (server client untuk API routes)
5. Buat src/types/index.ts dengan TypeScript types untuk semua tabel

Semua kolom harus sesuai persis dengan spec di section 7.
```

### Prompt 1.3 — Auth Flow
```
Implementasi auth flow dengan Supabase Auth.

Lakukan:
1. Buat src/app/(auth)/login/page.tsx — login form (email + password)
2. Buat src/app/(auth)/signup/page.tsx — signup form
3. Buat src/app/(auth)/layout.tsx — centered card layout untuk auth pages
4. Buat src/app/api/auth/callback/route.ts — auth callback handler
5. Buat middleware.ts di root — protect semua routes kecuali (auth)/*

Auth pages harus punya styling yang premium sesuai design system.
Gunakan glassmorphism card, accent purple, proper validation feedback.
```

### Prompt 1.4 — Layout Shell
```
Buat layout shell utama aplikasi.

Lakukan:
1. Update src/app/layout.tsx — root layout dengan:
   - Inter font dari Google Fonts
   - Proper metadata (title, description, PWA meta tags)
   - Auth provider/context
2. Buat src/components/layout/header.tsx — top navigation bar dengan:
   - App logo/nama "Feynman Challenge"
   - User info (display name)
   - Streak display placeholder
   - Logout button
3. Buat src/components/layout/sidebar.tsx (opsional, bisa bottom nav untuk mobile)

Styling sesuai design system. Dark mode, glassmorphism effects.
```

### ✅ Checkpoint Phase 1
```
Jalankan verification:
1. npx tsc --noEmit
2. npx next lint
3. npm run build
4. Test manual: buka browser, signup, login, lihat layout

Fix semua error sebelum lanjut ke Phase 2.
```

---

## PHASE 2: Challenge System (Notebook)

### Prompt 2.1 — Gemini Client + Outline Generation
```
Setup Gemini API client dan outline generation.

Lakukan:
1. Install @google/generative-ai
2. Buat src/lib/gemini/client.ts — Gemini API client wrapper (server-side only)
3. Buat src/lib/gemini/prompts.ts — prompt template untuk:
   - Outline generation: user kasih topik → Gemini generate learning outline + suggested sources + estimated duration
4. Buat src/lib/gemini/schemas.ts — Zod schemas untuk validate response Gemini:
   - OutlineGenerationSchema: { outline: [{title, description}], sources: [{title, url, type}], estimated_duration_sec: number }
5. Buat src/app/api/challenge/generate/route.ts — POST endpoint:
   - Terima { topic: string }
   - Kirim ke Gemini dengan prompt outline generation
   - Validate response dengan Zod
   - Return structured result

Gemini API key diakses dari env server-side only. Jangan pernah expose ke client.
Prompt harus instruksikan Gemini untuk return JSON terstruktur.
```

### Prompt 2.2 — Create Challenge Flow
```
Implementasi flow pembuatan challenge baru.

Lakukan:
1. Buat src/app/challenge/new/page.tsx — halaman create challenge:
   - Input field untuk topik (e.g., "Quantum Entanglement")
   - Date picker untuk deadline
   - Button "Generate Learning Plan"
   - Setelah generate: tampilkan preview outline + sources yang di-generate AI
   - Button "Create Challenge" untuk save ke database
2. Buat src/components/challenge/create-form.tsx — form component
3. Buat src/app/api/challenge/route.ts — POST handler:
   - Create challenge record
   - Create outline items dari AI response
   - Create sources dari AI response
   - Return challenge ID

UX: loading state saat AI generate, smooth transition ke preview.
Styling premium sesuai design system.
```

### Prompt 2.3 — Challenge Detail Page (Notebook)
```
Buat halaman detail challenge (notebook view).

Lakukan:
1. Buat src/app/challenge/[id]/page.tsx — notebook view dengan sections:
   - Header: judul challenge, mastery indicator, deadline badge
   - Learning Outline (editable): bisa add, delete, reorder items
   - Sumber Belajar: list sources dengan add/remove
   - My Notes: markdown text area
   - CTA button "Start Recording" → link ke /challenge/[id]/record
2. Buat components:
   - src/components/challenge/outline-editor.tsx — editable outline list
   - src/components/challenge/outline-item.tsx — single outline item (drag handle, edit, delete)
   - src/components/challenge/source-list.tsx — sources list
   - src/components/challenge/source-item.tsx — single source
   - src/components/challenge/notes-editor.tsx — markdown notes area
   - src/components/challenge/deadline-badge.tsx — deadline countdown
   - src/components/challenge/mastery-indicator.tsx — mastery state badge
3. Buat API routes:
   - src/app/api/challenge/[id]/route.ts — GET, PATCH, DELETE
   - src/app/api/challenge/[id]/outline/route.ts — CRUD outline
   - src/app/api/challenge/[id]/sources/route.ts — CRUD sources
   - src/app/api/challenge/[id]/notes/route.ts — CRUD notes

Outline editor harus smooth dan intuitive. Notes pakai simple textarea (bukan rich editor).
```

### ✅ Checkpoint Phase 2
```
Verification:
1. npx tsc --noEmit && npx next lint && npm run build
2. Test manual:
   - Create challenge baru → AI generate outline
   - Edit outline (add/delete items)
   - Add/remove sources
   - Tulis notes
   - Semua data persist di Supabase

Fix semua issues sebelum Phase 3.
```

---

## PHASE 3: Audio Recording

### Prompt 3.1 — Audio Recorder Engine
```
Implementasi audio recording engine.

Lakukan:
1. Buat src/lib/audio/recorder.ts — MediaRecorder wrapper class:
   - Methods: start(), stop(), pause(), resume(), getBlob()
   - Proper cleanup dan error handling
   - Output format: WebM (Opus codec) di Chrome/Firefox, fallback MP4 di Safari
   - Access microphone via getUserMedia
2. Buat src/hooks/use-audio-recorder.ts — React hook:
   - States: idle, recording, paused, stopped
   - Return: start, stop, pause, resume, audioBlob, duration, error
   - Real-time duration counter
   - Cleanup on unmount

Handle permission denied gracefully. Proper TypeScript types.
```

### Prompt 3.2 — Recording Screen
```
Buat full recording experience screen.

Lakukan:
1. Buat src/app/challenge/[id]/record/page.tsx — full-screen recording:
   - Judul challenge di top
   - Countdown timer (circular, menghitung mundur dari estimated duration)
   - Waveform visualizer (real-time audio visualization)
   - Hint panel (tiered: keywords → questions → outline)
   - Controls: Start, Pause, Stop & Submit
2. Components:
   - src/components/recording/countdown-timer.tsx — circular timer (SVG-based)
   - src/components/recording/waveform-visualizer.tsx — real-time waveform pakai Web Audio API AnalyserNode + Canvas
   - src/components/recording/hint-panel.tsx — tiered hints dengan score impact display:
     * Tanpa hint = maks 10
     * Keywords = maks 9
     * Guiding Questions = maks 8
     * Full Outline = maks 7
     * Sekali dibuka, score cap terkunci
   - src/components/recording/recorder-controls.tsx — control buttons
3. Setelah Stop & Submit:
   - Upload audio blob ke Supabase Storage
   - Create attempt record di database (evaluation_status: 'pending')
   - Redirect ke halaman "evaluating..." lalu ke results

Recording screen harus immersive — full screen, dark, focused.
Waveform harus real-time dan responsive.
Hint panel punya warning sebelum dibuka: "Membuka hint akan membatasi skor maks ke X"
```

### ✅ Checkpoint Phase 3
```
Verification:
1. npx tsc --noEmit && npx next lint && npm run build
2. Test manual:
   - Buka recording screen
   - Grant mic permission
   - Record audio → waveform bergerak
   - Pause/resume works
   - Open hints → score cap display berubah
   - Stop → audio uploaded ke Supabase Storage
   - Attempt record created di database
```

---

## PHASE 4: AI Evaluation

### Prompt 4.1 — Gemini Evaluation API
```
Implementasi AI evaluation endpoint dengan Gemini multimodal.

Lakukan:
1. Tambah evaluation prompt di src/lib/gemini/prompts.ts:
   - System role: Feynman evaluator
   - Rubrik: comprehensiveness (40%), accuracy (35%), clarity (25%)
   - Outline sebagai ground truth
   - Hint level context (adjust expectations)
   - Output format: JSON terstruktur
   Detail prompt ada di master spec section 3 (contoh prompt ke Gemini).
2. Tambah Zod schema di src/lib/gemini/schemas.ts:
   - EvaluationResultSchema: { transcript, overall_score, sub_scores, coverage[], feedback, strengths[], improvements[] }
3. Buat src/app/api/evaluate/route.ts:
   - Terima { attemptId: string }
   - Fetch audio dari Supabase Storage
   - Fetch challenge outline + notes dari DB
   - Kirim audio + outline + prompt ke Gemini (multimodal audio input)
   - Validate response dengan Zod
   - Update attempt record: scores, transcript, feedback, coverage, evaluation_status: 'completed'
   - Update challenge: latest_score, best_score, mastery_state (via mastery logic)
   - Return evaluation result
   - Config: export const maxDuration = 60 (Vercel timeout)
4. Buat src/lib/utils/mastery.ts — pure function mastery state machine:
   - Input: current state, new score, attempt history
   - Output: new mastery state
   - Logic sesuai section 6.6 master spec

Error handling: kalau Gemini gagal, set evaluation_status: 'error' dan return error message.
```

### Prompt 4.2 — Evaluation Results Page
```
Buat halaman results yang menampilkan evaluasi AI.

Lakukan:
1. Buat src/app/challenge/[id]/result/[attemptId]/page.tsx — results view
2. Components:
   - src/components/evaluation/score-ring.tsx — animated circular score (SVG):
     * Animasi count-up dari 0 ke skor
     * Warna ring berdasarkan skor (merah → kuning → hijau)
     * Tampilkan previous score comparison kalau ada
   - src/components/evaluation/sub-scores.tsx — breakdown bars:
     * Comprehensiveness, Accuracy, Clarity
     * Horizontal bar charts
   - src/components/evaluation/coverage-checklist.tsx — per-topic coverage:
     * ✅ covered, ⚠️ partial, ❌ missing
     * Dengan note dari AI per topik
   - src/components/evaluation/feedback-card.tsx — AI feedback:
     * Feedback text
     * Strengths list
     * Areas for improvement list
   - src/components/evaluation/transcript-view.tsx — collapsible transcript
   - src/components/evaluation/attempt-history.tsx — progress across attempts
3. Buttons:
   - "Try Again" → kembali ke recording
   - "Back to Notebook" → kembali ke challenge detail

Halaman ini harus WOW — ini payoff dari user experience.
Animasi score reveal, smooth transitions, informative dan encouraging.
```

### ✅ Checkpoint Phase 4
```
Verification:
1. npx tsc --noEmit && npx next lint && npm run build
2. Test FULL FLOW:
   - Create challenge → generate outline
   - Record audio → submit
   - Evaluation processes → results display
   - Scores, transcript, coverage, feedback semua tampil
   - Retry → attempt history shows
   - Mastery state updates correctly
```

---

## PHASE 5: Dashboard & Engagement

### Prompt 5.1 — Dashboard
```
Buat main dashboard sebagai home page.

Lakukan:
1. Update src/app/page.tsx — dashboard dengan sections:
   - Welcome message + streak display
   - "Due Soon" section — challenges approaching deadline
   - "Needs Review" section — mastery decay warnings (30+ days tanpa review)
   - "All Challenges" grid — semua challenges dengan mastery state, score, deadline
   - FAB atau button "New Challenge"
2. Components:
   - src/components/dashboard/streak-display.tsx — streak counter (🔥 icon + count)
   - src/components/dashboard/due-soon-section.tsx — deadline alerts
   - src/components/dashboard/decay-alert.tsx — mastery decay warnings
   - src/components/dashboard/challenge-list.tsx — grid of challenge cards
   - src/components/dashboard/challenge-card.tsx — individual card:
     * Mastery color indicator
     * Title, latest score, deadline
     * Click → navigate ke challenge detail
3. Buat src/lib/utils/deadline.ts:
   - Calculate deadline status (upcoming, due_today, overdue, extended)
   - Auto-extend logic
   - Nudge message generation sesuai section 6.5 master spec

Dashboard harus informative tapi tidak overwhelming. Clean grid layout.
Empty state untuk user baru yang belum punya challenge.
```

### ✅ Checkpoint Phase 5
```
Verification + full app test:
1. npx tsc --noEmit && npx next lint && npm run build
2. Test complete user journey:
   - Login → empty dashboard
   - Create challenge → AI generates outline
   - Edit outline, add notes
   - Record → submit → view results
   - Dashboard shows challenge with correct state
   - Deadlines display properly
```

---

## PHASE 6: Polish & PWA

### Prompt 6.1 — PWA + Polish
```
Finalisasi app dengan PWA support dan polish.

Lakukan:
1. PWA:
   - Buat public/manifest.json (app name, icons, theme color, display: standalone)
   - Buat public/sw.js — basic service worker untuk caching
   - Tambah PWA meta tags di root layout
2. Animations pass:
   - Page transitions (fade in)
   - Score reveal animation (count up effect)
   - Skeleton loading states untuk semua data-fetching
   - Smooth hover effects pada cards dan buttons
3. Responsive pass:
   - Mobile-first: semua halaman usable di 375px width
   - Recording screen: large touch targets, easy thumb reach
   - Dashboard grid: 1 column mobile, 2-3 column desktop
4. Error boundaries:
   - Global error boundary
   - Per-page error states dengan retry
5. Buat README.md — professional portfolio README:
   - Project title + tagline
   - Screenshots/demo GIF placeholder
   - Tech stack
   - Architecture overview
   - Setup instructions
   - Features list

Ini phase terakhir. Pastikan semua smooth dan production-ready.
```

### ✅ Final Checkpoint
```
FINAL verification:
1. npx tsc --noEmit && npx next lint && npm run build
2. Full user journey test (semua flow dari spec section 11)
3. Mobile responsive check
4. PWA installable check
5. Review README

🎉 Project selesai dan siap deploy ke Vercel!
```

---

## Tips Eksekusi di Claude Code

### Kalau Error
```
Ada error TypeScript di [file]. Fix tanpa mengubah behavior yang sudah benar.
```

### Kalau Styling Kurang
```
Styling di [component] kurang premium. Improve sesuai design system:
- Gunakan glassmorphism effect
- Tambah subtle animations
- Pastikan spacing consistent dengan CSS variables
```

### Kalau Perlu Revisi
```
Revisi [component/file]:
- [Perubahan spesifik 1]
- [Perubahan spesifik 2]
Jangan ubah yang lain.
```

### Kalau Mau Lihat Progress
```
Jalankan: npx tsc --noEmit && npm run build
Report hasilnya.
```
