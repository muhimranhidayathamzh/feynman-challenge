import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage } from "@/components/legal/legal-page";
import { legalEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Syarat Penggunaan",
  description:
    "Aturan main Feynman Challenge: penilaian AI bisa keliru, isi tetap milikmu, dan pemakaian yang wajar.",
};

export default function TermsPage() {
  const { contactEmail } = legalEnv();

  return (
    <LegalPage
      title="Syarat Penggunaan"
      lead="Aturan main yang singkat. Ini bukan nasihat hukum, melainkan janji dan batas yang kami pegang saat kamu memakai Feynman Challenge."
    >
      <h2>Layanannya</h2>
      <p>
        Feynman Challenge adalah alat belajar: kamu menjelaskan sebuah materi dengan
        suaramu, lalu AI menilai seberapa lengkap dan tepat penjelasanmu. Saat ini
        layanannya gratis.
      </p>

      <h2>Penilaian AI bisa keliru</h2>
      <p>
        Skor, transkrip, umpan balik, rencana belajar, dan sumber yang disarankan dibuat
        oleh AI. AI bisa salah dengar, salah menilai, atau menyarankan sumber yang keliru.
        Pakai hasilnya sebagai bahan belajar, dan cek sumber aslinya.{" "}
        <strong>
          Jangan memakainya untuk keputusan penting, seperti nilai resmi, seleksi kerja,
          atau keputusan medis, hukum, dan keuangan.
        </strong>
      </p>

      <h2>Akunmu</h2>
      <ul>
        <li>Jaga kata sandimu. Satu akun untuk satu orang.</li>
        <li>
          Akun demo tanpa email bisa hilang: saat kamu keluar, atau setelah tujuh hari
          tidak dipakai. Hubungkan email di Pengaturan kalau ingin menyimpannya.
        </li>
      </ul>

      <h2>Isimu tetap milikmu</h2>
      <p>
        Catatan, rekaman, dan tantangan yang kamu buat tetap milikmu. Kamu mengizinkan
        kami menyimpan dan memprosesnya hanya untuk menjalankan layanan, termasuk mengirim
        rekaman ke Google Gemini untuk dinilai, seperti dijelaskan di{" "}
        <Link href="/privasi">Kebijakan Privasi</Link>.
      </p>

      <h2>Pemakaian yang wajar</h2>
      <ul>
        <li>Jangan merekam suara orang lain tanpa izin mereka.</li>
        <li>Jangan mengunggah isi yang melanggar hukum atau hak orang lain.</li>
        <li>
          Jangan mencoba membobol, membebani, atau mengakali batas pemakaian. Kuota harian
          AI ada supaya layanan tetap bisa dipakai semua orang.
        </li>
      </ul>

      <h2>Layanan apa adanya</h2>
      <p>
        Kami berusaha menjaga layanan tetap jalan dan datamu tetap aman, tapi tidak bisa
        menjamin layanan bebas gangguan. Fitur bisa berubah, penilaian AI bisa dihentikan
        sementara saat batas harian tercapai, dan layanan bisa dihentikan. Sejauh
        diizinkan hukum, kami tidak bertanggung jawab atas kerugian akibat memakai atau
        tidak bisa memakai layanan ini.
      </p>

      <h2>Berhenti</h2>
      <p>
        Kamu bisa berhenti kapan saja dan menghapus akunmu di Pengaturan. Kami bisa
        menangguhkan akun yang menyalahgunakan layanan.
      </p>

      <h2>Hukum dan kontak</h2>
      <p>
        Syarat ini tunduk pada hukum Republik Indonesia. Kalau syarat ini berubah, tanggal
        di bagian atas ikut berubah. Untuk pertanyaan,{" "}
        <ContactLine email={contactEmail} />.
      </p>
    </LegalPage>
  );
}
