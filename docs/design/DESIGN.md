# DESIGN.md — Feynman Challenge

> Sumber kebenaran untuk semua keputusan visual dan UX. Wajib dibaca sebelum menyentuh CSS, komponen, atau copy.
> Status: **arah A "Kertas & Kapur" dipilih** (DV1, 19 September 2026). Dijalankan lewat Fase V di `prompts/improvement-plan.md`.
> Pembanding visual: buka `docs/design/arah-visual.html` di browser.

---

## 1. Titik berangkat: kebenaran produk

Desain ini tidak dimulai dari tren, tapi dari apa yang sebenarnya dialami user.

| Kebenaran | Akibatnya untuk desain |
|---|---|
| Inti produk adalah **berbicara dan dinilai**. Merekam diri sendiri itu canggung dan membuat cemas. | Layar rekam harus terasa aman, fokus, dan tanpa gangguan. Nada copy menyemangati, tidak menguji. |
| Sebagian besar waktu dipakai untuk **membaca**: outline, sumber, catatan, transkrip, feedback. | Tipografi bacaan yang nyaman lebih penting daripada efek visual. |
| User paling penasaran pada **apa yang benar dan salah dari penjelasannya**, bukan pada angka. | Bukti (kutipan transkrip, tandai poin) tampil setara atau di atas skor. |
| Belajar itu maraton. Sistem review dan streak ada untuk kebiasaan jangka panjang. | Progres digambarkan sebagai pertumbuhan yang tenang, bukan hukuman merah. |
| User utama: pelajar dan pekerja di Indonesia, mayoritas di ponsel, sering belajar malam. | Mobile-first, Bahasa Indonesia yang hangat, mode gelap yang benar-benar nyaman. |
| Nama produknya Feynman: guru yang terkenal karena kesederhanaan, papan tulis, dan diagram. | Metafora visual diambil dari dunia itu, bukan dari template aplikasi AI. |

---

## 2. Konsep: Kertas & Kapur

**Belajar di atas kertas, menjelaskan di depan papan tulis.**

- **Suasana Kertas** (mode terang, default): catatan belajar, hasil evaluasi, dashboard, pengaturan. Latar kertas hangat, tinta gelap, stabilo untuk bukti. Terasa seperti buku catatan pribadi yang dikoreksi guru yang baik.
- **Suasana Papan Tulis** (layar rekam, dan seluruh mode gelap): hijau-hitam pekat dengan teks seperti kapur. Menjelaskan adalah momen "tampil", jadi layar rekam selalu memakai suasana ini, di mode apa pun.

Pergantian suasana ini punya makna: user tahu tanpa membaca bahwa dia sedang "belajar" atau sedang "menjelaskan".

---

## 3. Prinsip

1. **Satu hal utama per layar.** Setiap layar punya satu aksi utama yang jelas. Dashboard membuka dengan "apa yang dikerjakan hari ini", bukan deretan statistik.
2. **Bukti di atas angka.** Skor selalu ditemani kalimat ringkasan dan kutipan dari ucapan user. Angka tanpa alasan terasa sewenang-wenang.
3. **Hangat, tidak menghakimi.** Celah pemahaman bukan kesalahan. Merah hanya untuk error sistem, tidak pernah untuk hasil belajar.
4. **Tenang saat belajar, hidup saat berhasil.** Animasi disimpan untuk momen yang berarti: skor muncul, poin baru tercakup, naik level.
5. **Jujur.** Harga hint ditulis di tombolnya. Batas AI dan mode demo dijelaskan apa adanya.

---

## 4. Warna

Semua warna lewat token di `src/styles/tokens.css`. Rasio kontras dihitung terhadap latar tempat warna itu dipakai (WCAG 2.1).

### Suasana Kertas (terang)

| Token | Nilai | Pakai untuk | Kontras |
|---|---|---|---|
| `--paper` | `#F4EFE4` | Latar halaman | |
| `--surface` | `#FFFCF5` | Kartu, lembar | |
| `--sunken` | `#EAE3D4` | Input, trek progress, area cekung | |
| `--line` | `#DDD3C1` | Garis rambut, pembatas | |
| `--ink` | `#1E2230` | Teks utama | 13,8 : 1 di kertas |
| `--ink-2` | `#4E5566` | Teks sekunder | 6,5 : 1 |
| `--ink-3` | `#5F6474` | Teks pudar, label kecil | 5,1 : 1 kertas, 4,6 : 1 cekung |
| `--accent` | `#C8431B` | Vermilion: tombol utama, tombol rekam, fokus | teks putih 4,9 : 1 |
| `--accent-press` | `#9F3413` | Sisi bawah tombol utama (efek tekan) | |
| `--accent-text` | `#A93814` | Tautan dan teks aksen | 5,6 : 1 |
| `--covered` | `#2B7148` | Poin tercakup, perubahan membaik | 5,8 : 1 di surface |
| `--partial` | `#8F5E05` | Poin sebagian | 5,4 : 1 |
| `--missing` | pakai `--ink-3` | Poin belum dibahas (lingkaran putus-putus) | |
| `--error` | `#B42318` | HANYA error sistem dan aksi berbahaya | 6,4 : 1 |
| `--highlight` | `#FBE38E` | Stabilo di belakang kutipan bukti | tinta di atasnya 12,4 : 1 |

### Suasana Papan Tulis (gelap dan layar rekam)

| Token | Nilai | Kontras |
|---|---|---|
| `--paper` | `#141B19` | |
| `--surface` | `#1B2421` | |
| `--sunken` | `#101614` | |
| `--line` | `#2C3833` | |
| `--ink` | `#ECE8DF` (kapur) | 14,3 : 1 |
| `--ink-2` | `#B9BEB5` | 9,2 : 1 |
| `--ink-3` | `#949B92` | 6,1 : 1 |
| `--accent` | `#EE7A52`, teks di atasnya `#1A120E` | 6,6 : 1 |
| `--covered` / `--partial` / `--error` | `#6CC291` / `#E6B552` / `#F08A7C` | 7,4 / 8,4 / 6,5 : 1 |
| `--highlight` | `#E6B552` dengan opasitas 25% | |

### Aturan warna

- Vermilion hanya untuk **satu aksi utama per layar** dan tombol rekam. Jangan dipakai untuk dekorasi.
- **Tanpa gradient**, kecuali efek stabilo (gradient tajam yang meniru goresan spidol).
- **Tanpa glow dan tanpa glassmorphism.** Kedalaman dibuat dengan garis rambut dan warna permukaan, bukan blur.
- **Skala penguasaan** memakai satu rona hijau yang makin pekat (tinta yang mengisi), bukan merah ke hijau:
  terang `#9DBBA6 → #6FA383 → #468A66 → #2B6E4E → #1B4A38`, gelap `#4C6E5B → #5E8E72 → #74AD8A → #92CBA6 → #BDE6CB`.
  Level bawah sengaja pudar, jadi penguasaan **selalu** tampil bersama label dan jumlah segmen.
- Warna tidak pernah menjadi satu-satunya penanda. Status coverage juga dibedakan bentuk (penuh, setengah, putus-putus).

---

## 5. Tipografi

| Peran | Font | Kenapa |
|---|---|---|
| Suara "guru": judul, ringkasan hasil, angka besar, catatan, transkrip | **Newsreader** (serif, optical size) | Dibuat untuk membaca di layar. Memberi rasa buku dan tulisan tangan guru tanpa jadi kuno. |
| Antarmuka: tombol, label, navigasi, formulir, data kecil | **Plus Jakarta Sans** | Dibuat Tokotype untuk identitas kota Jakarta. Pilihan lokal yang punya alasan, jelas di ukuran kecil, punya angka tabular. |

Keduanya dimuat lewat `next/font/google`. Inter dihapus.

**Skala** (mobile, lalu desktop di kurung):

| Token | Ukuran | Font | Pakai |
|---|---|---|---|
| `--text-display` | 40 (56) | Newsreader 500 | Skor, angka timer |
| `--text-h1` | 28 (34) | Newsreader 600 | Judul halaman |
| `--text-h2` | 21 (24) | Newsreader 600 | Judul bagian |
| `--text-lead` | 17 (19) | Newsreader 400 | Ringkasan hasil, paragraf pembuka |
| `--text-body` | 16 | Plus Jakarta Sans 400 | Teks UI umum. Input minimal 16 supaya iOS tidak zoom |
| `--text-read` | 17 | Newsreader 400, line-height 1.6 | Catatan, transkrip, feedback panjang |
| `--text-sm` | 14 | Plus Jakarta Sans 500 | Label, meta |
| `--text-xs` | 12 | Plus Jakarta Sans 600 | Keterangan kecil, satuan |

**Aturan:**
- Tanpa huruf kapital semua. Label memakai sentence case.
- Angka skor dan timer memakai `font-variant-numeric: tabular-nums`. Skor ditulis bilangan bulat, "7 /10".
- Panjang baris teks bacaan maksimal 65 karakter.
- Italic Newsreader hanya untuk kutipan ucapan user, bukan untuk gaya.

---

## 6. Ruang, bentuk, kedalaman

- **Spasi**: tetap skala 4 px yang ada (`--space-*`). Kartu berjarak lebih lega di desktop.
- **Radius**: 8 (input, chip), 14 (kartu), 20 (lembar besar, dialog). Tombol 12, bukan pil.
- **Kedalaman**: kartu = `--surface` + garis rambut `--line`, tanpa bayangan. Bayangan hanya untuk hal yang mengambang: dialog, toast, menu, dan header saat di-scroll.
- **Tombol utama taktil**: sisi bawah 3 px `--accent-press`. Saat ditekan turun 2 px dan sisi bawah hilang.
- **Tekstur kertas**: tidak ada gambar tekstur. Kesan kertas datang dari warna, garis rambut, dan tipografi.

---

## 7. Ikon, logo, ilustrasi

- **Ikon UI**: lucide-react, stroke 1.75, ukuran 20 (16 di teks kecil). Tidak ada emoji di UI.
- **Ikon khusus** (digambar sendiri): tanda coverage (lingkaran penuh dengan centang, setengah terisi, lingkaran putus-putus), meter penguasaan, kotak Leitner.
- **Logo**: diagram Feynman tegak. Dua garis bertemu di satu titik, gelombang naik darinya: dua ide bertemu dan melahirkan penjelasan. Menggantikan ikon otak dari lucide. Konsep di `arah-visual.html`, versi final digambar ulang di grid dan diuji di 16 px.
- **Ilustrasi**: gaya garis tunggal seperti diagram papan tulis, tinta plus satu aksen. Hanya di onboarding, halaman kosong, landing, dan offline. Tidak memakai ilustrasi 3D, stok, atau karakter maskot.

---

## 8. Gerak

| Token | Durasi | Pakai |
|---|---|---|
| `--motion-fast` | 120 ms | Hover, tekan tombol |
| `--motion-base` | 200 ms | Buka tutup, pindah tab |
| `--motion-slow` | 320 ms | Masuk halaman, dialog |

Easing tetap `--ease-out` yang ada.

**Momen khas** (sekali jalan, tidak berulang):
- **Goresan tinta**: tanda coverage dan garis penguasaan "digambar" dengan stroke-dashoffset saat hasil muncul.
- **Sapuan stabilo**: kutipan bukti di transkrip disorot dari kiri ke kanan.
- **Skor muncul**: angka naik dari 0 ke skor dalam 600 ms maksimal, sekali.
- **Naik level**: meter penguasaan mengisi segmen baru dengan jeda singkat.

**Larangan**: animasi berulang tanpa henti, kecuali titik "sedang merekam". Denyut glow. Parallax. Semua gerak mati total saat `prefers-reduced-motion`.

---

## 9. Suara dan copy

Nada: teman belajar yang pintar dan jujur. Memakai "kamu", kalimat pendek, tidak berlebihan memuji, tidak pernah mempermalukan.

| Situasi | Hindari | Pakai |
|---|---|---|
| Skor rendah | "Skor kamu buruk." | "Ini baru awal. Dua poin sudah kamu kuasai, tiga lagi yang perlu dikejar." |
| Poin belum dibahas | "Gagal: Siklus Calvin" | "Belum dibahas: Siklus Calvin" |
| Mulai rekam | "Rekam sekarang!" | "Siap? Jelaskan seperti ke teman yang belum pernah dengar." |
| Hint | "Buka hint" | "Lihat kata kunci · skor maks 9" |
| Error AI | "Error 500" | "Penilaian gagal kali ini. Rekamanmu aman, coba nilai ulang." |

Kata untuk skor (ringkasan satu frasa, selalu bersama angka): 0–3 "Baru mulai", 4–5 "Mulai paham", 6–7 "Sudah paham intinya", 8–9 "Paham betul", 10 "Bisa mengajarkannya".

---

## 10. Komponen kunci

| Komponen | Inti desain |
|---|---|
| `Button` | Utama: vermilion taktil. Sekunder: garis tinta 1,5 px. Ghost: teks tinta. Tinggi minimal 44 px. |
| `Sheet` (pengganti Card) | Lembar `--surface` dengan garis rambut, radius 14. Tanpa blur, tanpa glow. |
| `CoverageMark` | Tiga bentuk: penuh-centang, setengah, putus-putus. SVG sendiri, dengan label untuk screen reader. |
| `ScoreFigure` | Angka Newsreader besar, "/10" kecil, frasa skor, dan chip perubahan dari percobaan sebelumnya. Menggantikan cincin gradient. |
| `SubScoreBars` | Tiga bar tipis berwarna tinta, angka di kanan. |
| `AnnotatedTranscript` | Transkrip Newsreader. Kutipan bukti diberi stabilo dan terhubung ke poin outline. Istilah yang belum dijelaskan digaris bawah titik-titik. |
| `MasteryMeter` | Lima segmen tinta hijau + label level ("Cakap · level 3 dari 5"). |
| `LeitnerStrip` | Enam kotak berlabel interval, kotak aktif terisi tinta. Menjelaskan kapan topik kembali. |
| `WeekStrip` | Tujuh kotak hari untuk streak, menggantikan badge api. |
| `HintChip` | Garis putus-putus dengan harga di dalamnya: "Kata kunci · maks 9". |
| `EmptyState` | Ilustrasi garis, satu kalimat, satu aksi. |

---

## 11. Layar kunci

- **Landing publik** (baru): apa Feynman Technique dalam 3 langkah bergambar, contoh hasil evaluasi asli dari demo, tombol "Coba tanpa akun" dan "Daftar". Pengunjung tidak lagi langsung dilempar ke form login.
- **Onboarding pertama kali**: 3 layar singkat (pelajari, jelaskan, lihat celahmu), lalu langsung buat tantangan pertama.
- **Meja Belajar** (dashboard): kartu "Hari ini" dengan satu aksi, WeekStrip, lalu daftar tantangan seperti indeks buku: judul, meter penguasaan, review berikutnya.
- **Catatan belajar**: lembar kertas. Outline bernomor di margin dengan tren coverage, sumber seperti daftar pustaka, catatan dalam serif. Tombol "Jelaskan sekarang" menempel di bawah pada ponsel.
- **Panggung rekam**: papan tulis penuh. Judul topik, timer besar, gelombang suara seperti goresan kapur, HintChip, tombol rekam vermilion. Tidak ada navigasi lain.
- **Hasil**: ringkasan satu kalimat (serif) paling atas, ScoreFigure, poin yang dijelaskan dengan CoverageMark dan "Pelajari lagi", AnnotatedTranscript, pertanyaan lanjutan, lalu aksi "Jelaskan lagi".

---

## 12. Larangan (anti AI slop)

Ditolak di review, tanpa pengecualian:

- Gradient ungu ke biru, atau gradient dekoratif apa pun.
- Glassmorphism, `backdrop-filter`, glow, dan bayangan berwarna.
- Inter, atau satu font sans untuk segalanya.
- Emoji sebagai ikon.
- Deretan kartu identik dengan ikon di atas dan dua baris teks.
- Huruf kapital semua untuk label dan tombol.
- Cincin skor bergradient dan angka tanpa penjelasan.
- Merah untuk hasil belajar.
- Dark mode sebagai satu-satunya tema.

---

## 13. Aksesibilitas

- Semua pasangan teks lolos WCAG AA di kedua suasana. Cek ulang setiap menambah warna.
- Cincin fokus: 2 px `--accent` dengan jarak 2 px, terlihat di kertas maupun papan tulis.
- Target sentuh minimal 44 × 44 px.
- Warna tidak pernah satu-satunya penanda.
- Tema mengikuti sistem secara default, bisa dipilih manual di Pengaturan (Terang, Gelap, Ikuti sistem).
- `prefers-reduced-motion` mematikan semua gerak di bagian 8.

---

## 14. Cara memakai dokumen ini

- Token dan aturan hanya diubah di sini dan di `tokens.css`, dalam commit yang sama.
- Setiap prompt Fase V membaca dokumen ini lebih dulu dan menyebut bagian yang dipakainya.
- Keputusan baru yang menyimpang dari dokumen ini ditulis di sini dulu, baru diterapkan.
