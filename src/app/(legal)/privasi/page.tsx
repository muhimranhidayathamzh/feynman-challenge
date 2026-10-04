import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage } from "@/components/legal/legal-page";
import { legalEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Data apa yang disimpan Feynman Challenge, ke mana rekamanmu dikirim, berapa lama disimpan, dan cara menghapusnya.",
};

const GEMINI_TERMS = "https://ai.google.dev/gemini-api/terms";

export default function PrivacyPage() {
  const { geminiPaidTier, contactEmail, errorMonitoring } = legalEnv();

  return (
    <LegalPage
      title="Kebijakan Privasi"
      lead="Feynman Challenge menilai penjelasanmu dari suaramu, jadi kamu menitipkan sesuatu yang pribadi. Halaman ini menjelaskan apa yang disimpan, ke mana data itu pergi, dan cara menghapusnya."
    >
      <h2>Ringkasnya</h2>
      <ul>
        <li>Rekaman suaramu dikirim ke Google Gemini untuk dinilai.</li>
        <li>Datamu tidak dijual, dan tidak ada iklan maupun pelacak di aplikasi ini.</li>
        <li>
          Kamu bisa menghapus satu tantangan beserta rekamannya, atau seluruh akunmu,
          kapan saja dari aplikasi.
        </li>
      </ul>

      <h2>Data yang disimpan</h2>
      <dl>
        <dt>Akun</dt>
        <dd>
          Email, nama tampilan (boleh kosong), dan zona waktu. Kalau kamu masuk dengan
          Google, nama dan email diambil dari akun Google-mu. Mode demo tidak menyimpan
          email sama sekali.
        </dd>
        <dt>Bahan belajar</dt>
        <dd>Topik tantangan, outline, sumber, catatanmu, dan tenggat.</dd>
        <dt>Rekaman suara</dt>
        <dd>Setiap penjelasan yang kamu kirim dan setiap jawaban pertanyaan lanjutan.</dd>
        <dt>Hasil penilaian</dt>
        <dd>Transkrip rekamanmu, skor, dan umpan balik.</dd>
        <dt>Catatan pemakaian AI</dt>
        <dd>
          Jenis permintaan, jumlah token, dan lamanya, untuk mengendalikan biaya. Tanpa
          isi rekaman, transkrip, atau teks apa pun.
        </dd>
        <dt>Cookie</dt>
        <dd>
          Cookie sesi supaya kamu tetap masuk, dan satu cookie untuk pilihan tema. Tidak
          ada cookie iklan atau pelacak.
        </dd>
      </dl>

      <h2>Untuk apa</h2>
      <p>
        Hanya untuk menjalankan aplikasi: menyusun rencana belajar, menilai penjelasanmu,
        menjadwalkan review, dan menjaga kuota AI supaya biayanya terkendali dan layanan
        tidak disalahgunakan. Datamu tidak dipakai untuk iklan dan tidak dijual.
      </p>

      <h2>Rekamanmu dan Google Gemini</h2>
      <p>
        Untuk dinilai, rekamanmu beserta outline tantangannya dikirim ke Gemini, layanan
        AI milik Google. Topik yang kamu tulis saat membuat tantangan juga diproses Gemini
        untuk menyusun rencana belajar.
      </p>
      {geminiPaidTier ? (
        <p>
          Aplikasi ini memakai layanan Gemini berbayar. Menurut{" "}
          <a href={GEMINI_TERMS} target="_blank" rel="noopener noreferrer">
            ketentuan Google
          </a>{" "}
          untuk layanan berbayar, Google tidak memakai isi yang dikirim untuk meningkatkan
          produknya, dan hanya menyimpannya untuk waktu terbatas guna mendeteksi
          penyalahgunaan.
        </p>
      ) : (
        <p>
          Saat ini aplikasi memakai kuota gratis Gemini. Menurut{" "}
          <a href={GEMINI_TERMS} target="_blank" rel="noopener noreferrer">
            ketentuan Google
          </a>{" "}
          untuk layanan gratis, Google dapat memakai isi yang dikirim, termasuk rekamanmu,
          untuk meningkatkan produknya, dan peninjau manusia dapat membacanya setelah
          dipisahkan dari identitas akun aplikasi ini. Karena itu,{" "}
          <strong>
            jangan menyebut data pribadi seperti nama lengkap, alamat, atau nomor telepon
            di dalam rekaman
          </strong>
          .
        </p>
      )}

      <h2>Siapa lagi yang memproses datamu</h2>
      <ul>
        <li>
          <strong>Supabase</strong>: basis data, akun, dan penyimpanan rekaman.
        </li>
        <li>
          <strong>Vercel</strong>: menjalankan situs ini.
        </li>
        <li>
          <strong>Google</strong>: Gemini untuk penilaian, dan Google Sign-In kalau kamu
          memakainya.
        </li>
        {errorMonitoring && (
          <li>
            <strong>Sentry</strong>: laporan error teknis, seperti bagian aplikasi yang
            gagal dan berapa lama prosesnya. Tanpa rekaman, transkrip, catatan, email,
            atau identitasmu.
          </li>
        )}
      </ul>
      <p>Server mereka bisa berada di luar Indonesia.</p>

      <h2>Berapa lama disimpan</h2>
      <ul>
        <li>
          Selama akunmu ada. Menghapus tantangan ikut menghapus semua percobaan dan
          rekamannya. Menghapus akun menghapus semuanya.
        </li>
        <li>
          Rekaman yang tidak terpakai, misalnya unggahan yang terputus di tengah jalan,
          dihapus otomatis setelah satu hari.
        </li>
        <li>
          Akun demo tanpa email dihapus beserta isinya setelah tujuh hari tidak dipakai.
        </li>
        <li>
          Kalau basis data punya cadangan otomatis, salinan lamanya ikut hilang mengikuti
          siklus cadangan penyedianya.
        </li>
      </ul>

      <h2>Hakmu</h2>
      <p>
        Sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, kamu
        berhak melihat, memperbaiki, dan menghapus datamu, serta menarik persetujuanmu.
      </p>
      <ul>
        <li>
          <strong>Melihat dan memperbaiki</strong>: semua tantangan, catatan, dan hasilmu
          bisa dibuka dan diubah di aplikasi. Nama dan zona waktu ada di Pengaturan.
        </li>
        <li>
          <strong>Menghapus</strong>: buka{" "}
          <Link href="/pengaturan#hapus-akun">Pengaturan, Zona berbahaya</Link>, lalu
          pilih Hapus akun. Rekaman dihapus lebih dulu, lalu akunnya.
        </li>
        <li>
          <strong>Menarik persetujuan</strong>: berhenti memakai aplikasi dan hapus
          akunmu.
        </li>
        <li>
          <strong>Permintaan lain</strong>, misalnya salinan datamu:{" "}
          <ContactLine email={contactEmail} />.
        </li>
      </ul>

      <h2>Anak-anak</h2>
      <p>
        Kalau usiamu di bawah 18 tahun, pakai Feynman Challenge dengan izin orang tua atau
        walimu.
      </p>

      <h2>Keamanan</h2>
      <p>
        Setiap baris data dilindungi aturan akses di basis data, sehingga hanya kamu yang
        bisa membacanya. Rekaman disimpan di penyimpanan privat dan hanya bisa diputar
        lewat tautan sementara. Kunci layanan AI tidak pernah sampai ke browser. Tidak ada
        sistem yang kebal, tapi inilah yang kami jaga.
      </p>

      <h2>Perubahan</h2>
      <p>Kalau kebijakan ini berubah, tanggal di bagian atas ikut berubah.</p>
    </LegalPage>
  );
}
