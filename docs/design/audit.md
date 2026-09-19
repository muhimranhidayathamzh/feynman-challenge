# Audit Visual & UX — sebelum Fase V

> Dibuat di Prompt V.1 (19 September 2026) dari 44 screenshot galeri: 22 layar × lebar 390 dan 1280 px.
> Screenshot: `docs/design/shots/before/<layar>-<lebar>.png`. Galeri: jalankan `npm run dev`, buka `/dev/galeri`.
> Acuan penilaian: `docs/design/DESIGN.md`. Kolom "Diperbaiki di" menunjuk prompt Fase V.

## Ringkasan

Fondasinya sehat: kontras teks lolos AA, komponen konsisten, status error dan audio ditolak punya copy yang jelas. Masalah terbesar ada di tiga tempat:

1. **Catatan belajar di ponsel praktis rusak.** Kontrol edit memakan lebar sampai teks terjepit satu kata per baris.
2. **Tidak ada hierarki.** Hampir setiap layar adalah tumpukan kartu dengan bobot sama. Tidak ada satu aksi utama yang jelas, dan hal terpenting di halaman hasil baru muncul setelah beberapa layar scroll.
3. **Visual generik dan menghakimi.** Gradient ungu-biru, glow, dan ikon dekoratif di mana-mana. Merah dipakai untuk hasil belajar yang rendah.

## Temuan, urut dari dampak terbesar

### Tinggi: menghambat pemakaian

| # | Layar | Masalah | Diperbaiki di |
|---|---|---|---|
| 1 | `catatan-390` | Tiap poin outline menampilkan 5 kontrol sekaligus (seret, naik, turun, edit, hapus). Judul dan deskripsi terjepit di kolom sekitar 70 px, satu kata per baris. | V.5: kontrol masuk mode edit atau menu, teks memakai lebar penuh |
| 2 | `catatan-390` | Form tambah sumber: kolom URL terjepit hingga sekitar 20 px dan tidak bisa dipakai. | V.5: kolom ditumpuk vertikal di ponsel |
| 3 | `hasil-selesai-390` | Halaman hasil setinggi 4.273 px dengan 10 kartu berbobot sama. Cincin skor memenuhi layar pertama. Umpan balik (penjelasan skor) baru muncul sekitar 1.700 px ke bawah. | V.4: ringkasan satu kalimat paling atas, lalu skor ringkas, poin, transkrip beranotasi |
| 4 | `dashboard-isi-390` | Satu tantangan bisa muncul tiga kali: "Segera Jatuh Tempo", "Review Hari Ini", dan daftar. Tidak ada satu aksi utama untuk hari ini. | V.6: kartu "Hari ini" dengan satu aksi dari `pickTodayAction` |
| 5 | `rekam-siap-390` | Sebelum mulai, user tidak diberi tahu apa yang harus dijelaskan. Outline hanya muncul sebagai hint berbayar setelah merekam. Kotak gelombang kosong, dan timer menulis "03:00 tersisa" padahal belum mulai. | V.5: layar persiapan singkat (topik, jumlah poin, ajakan), timer "3 menit" sebelum mulai |
| 6 | `login-390` | Pengunjung baru langsung melihat form masuk tanpa penjelasan produk. "Coba tanpa akun" ada di paling bawah dengan gaya paling lemah. | V.6: landing publik dengan demo sebagai ajakan utama |

### Sedang: merusak kejelasan dan kesan

| # | Layar | Masalah | Diperbaiki di |
|---|---|---|---|
| 7 | `dashboard-isi` | Warna menghakimi: skor 4 merah, titik merah untuk "Dicoba", garis kiri merah pada kartu, pengingat tenggat merah. Bertentangan dengan DESIGN.md §3 poin 3. | V.2, V.3 |
| 8 | Semua | Pola AI slop: gradient ungu-biru di nama user, judul brand, tombol utama, cincin timer dan skor; glow; glassmorphism; ikon dekoratif di setiap judul bagian; garis kiri berwarna di kartu. | V.2, V.3 |
| 9 | `dashboard-*` | Streak tampil dua kali (header dan kartu besar). User baru melihat "0 hari" di dua tempat. | V.6: WeekStrip, streak disembunyikan sampai hari pertama |
| 10 | `dashboard-isi-390` | Kartu tenggat dan review: judul terlipat 4 baris karena teks pengingat diletakkan sejajar di kanan. | V.3, V.6: teks pengingat di baris sendiri |
| 11 | `rekam-merekam-390` | Panel hint besar dengan peringatan kuning mendominasi layar saat user seharusnya fokus bicara. Semua kata kunci tampil sekaligus. | V.5: HintChip ringkas, panel dibuka sesuai permintaan |
| 12 | `catatan-*` | Editor markdown mentah tampil lebih dulu walau catatan sudah berisi. Untuk membaca harus klik "Pratinjau". | V.5: pratinjau jadi default bila ada isi |
| 13 | `catatan-*` | Aksi utama "Mulai Rekam" ada di paling bawah, setelah outline, sumber, dan catatan. | V.5: tombol menempel di bawah layar ponsel |
| 14 | `catatan-*` | Kontrol edit selalu tampil, jadi halaman terasa seperti formulir, bukan bahan belajar. | V.5 |
| 15 | `hasil-selesai-1280` | Desktop memakai satu kolom sekitar 720 px dengan ruang kosong lebar. Transkrip terlipat, padahal bisa berdampingan dengan daftar poin. | V.4: dua kolom di desktop |
| 16 | `hasil-selesai-*` | Grafik "Perkembangan" memakai ruang besar untuk dua batang dengan warna yang tidak bermakna. | V.4, lalu riwayat lengkap di Prompt 4.1 |
| 17 | `rekam-dengarkan-390` | Tiga tombol dengan lebar berbeda ditumpuk di tengah. Hierarki Kirim, Rekam ulang, dan Buang tidak konsisten. | V.5 |
| 18 | `buat-tantangan`, `pengaturan` | Tombol utama yang nonaktif (gradient pudar) terlihat keruh, seperti rusak. | V.3 |
| 19 | `dialog-390` | Di dialog hapus, tombol "Hapus" tampil lebih lemah daripada "Batal" yang berbingkai ungu tebal. | V.3 |

### Rendah: copy dan detail

| # | Layar | Masalah | Diperbaiki di |
|---|---|---|---|
| 20 | `dashboard-isi` | Emoji 🎙️ di pengingat "Besok! Sudah siap?" (`src/lib/utils/deadline.ts`). Aturan: tanpa emoji di UI. | V.3 |
| 21 | Beberapa | Tanda pisah panjang di copy ("pertamamu — pilih topik", "Pilih topik apapun —"). "apapun" seharusnya "apa pun". Kata Inggris "reschedule" di pengingat tenggat. | V.3 sampai V.6, per layar |
| 22 | `rekam-siap-390` | Ikon mikrofon di bawah tombol "Mulai Rekam" tidak sejajar dengan teksnya. | V.5 |
| 23 | `hasil-selesai` | Label bobot "Kelengkapan (40%)" menambah beban baca tanpa membantu keputusan. | V.4: bobot dipindah ke keterangan |
| 24 | `hasil-selesai-390` | Judul "Hasil Evaluasi · Percobaan #2" terlalu besar dan terlipat di ponsel. | V.4 |
| 25 | `toast-1280` | Toast muncul di tengah bawah dan menutupi kartu. | V.3: pojok kanan bawah di desktop |

## Yang sudah baik dan dipertahankan

- Kontras teks lolos WCAG AA, fokus keyboard terlihat, status tidak hanya dibedakan warna di titik tren.
- Layar "Rekaman belum bisa dinilai" (`hasil-ditolak`) jujur dan menenangkan: menjelaskan penyebab dan menegaskan skor tidak terpengaruh.
- Bagian "Dibanding Percobaan #1" dan "Pelajari lagi" sudah memberi arah belajar yang konkret. Tinggal diberi tempat yang lebih tinggi.
- Pesan error dan copy umumnya hangat dan berbahasa Indonesia yang wajar.

## Batasan galeri

- Pemutar audio tidak tampil karena galeri tidak punya rekaman. Di aplikasi asli, pemutar muncul di "Dengarkan dulu" dan halaman hasil.
- Gelombang suara butuh mikrofon, jadi di galeri kotaknya selalu kosong. Di aplikasi asli, kotak ini juga kosong sebelum mulai merekam (temuan 5).
- Screenshot diambil dengan `reducedMotion: reduce`, jadi animasi masuk tidak terlihat.
