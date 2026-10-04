// The dev gallery's screens, in review order. Shared by the index page (server)
// and the renderer (client). scripts/shots.mjs reads the ids from the index.

export type FrameShell = "app" | "auth" | "bare";

export interface FrameMeta {
  id: string;
  group: string;
  title: string;
  shell: FrameShell;
  /** Route the screen lives at in the real app (marks the active nav item). */
  path: string;
  /** "viewport": photograph one screen only (overlays such as dialogs, toasts). */
  capture?: "page" | "viewport";
}

export const FRAMES: readonly FrameMeta[] = [
  { id: "komponen", group: "Sistem", title: "Komponen", shell: "bare", path: "/" },
  { id: "landing", group: "Publik", title: "Landing", shell: "bare", path: "/" },
  { id: "login", group: "Publik", title: "Masuk", shell: "auth", path: "/login" },
  { id: "daftar", group: "Publik", title: "Daftar", shell: "auth", path: "/signup" },
  { id: "offline", group: "Publik", title: "Offline", shell: "bare", path: "/offline" },
  {
    id: "404",
    group: "Publik",
    title: "Halaman tidak ditemukan",
    shell: "bare",
    path: "/x",
  },

  {
    id: "dashboard-kosong",
    group: "Beranda",
    title: "Beranda kosong",
    shell: "app",
    path: "/",
  },
  {
    id: "dashboard-isi",
    group: "Beranda",
    title: "Beranda berisi",
    shell: "app",
    path: "/",
  },
  {
    id: "dashboard-demo",
    group: "Beranda",
    title: "Beranda mode demo",
    shell: "app",
    path: "/",
  },
  {
    id: "buat-tantangan",
    group: "Tantangan",
    title: "Tantangan baru",
    shell: "app",
    path: "/challenge/new",
  },
  {
    id: "catatan",
    group: "Tantangan",
    title: "Catatan belajar",
    shell: "app",
    path: "/challenge/x",
  },
  {
    id: "catatan-riwayat",
    group: "Tantangan",
    title: "Riwayat percobaan panjang",
    shell: "app",
    path: "/challenge/x",
  },

  { id: "rekam-siap", group: "Rekam", title: "Siap merekam", shell: "bare", path: "/r" },
  {
    id: "rekam-merekam",
    group: "Rekam",
    title: "Sedang merekam",
    shell: "bare",
    path: "/r",
  },
  { id: "rekam-jeda", group: "Rekam", title: "Dijeda", shell: "bare", path: "/r" },
  {
    id: "rekam-izin",
    group: "Rekam",
    title: "Izin mikrofon ditolak",
    shell: "bare",
    path: "/r",
  },
  {
    id: "rekam-dengarkan",
    group: "Rekam",
    title: "Dengarkan sebelum kirim",
    shell: "bare",
    path: "/r",
  },
  {
    id: "rekam-mengunggah",
    group: "Rekam",
    title: "Mengunggah",
    shell: "bare",
    path: "/r",
  },

  {
    id: "hasil-selesai",
    group: "Hasil",
    title: "Hasil evaluasi",
    shell: "app",
    path: "/h",
  },
  {
    id: "hasil-ditolak",
    group: "Hasil",
    title: "Audio tidak bisa dinilai",
    shell: "app",
    path: "/h",
  },
  {
    id: "hasil-diproses",
    group: "Hasil",
    title: "Sedang dinilai",
    shell: "app",
    path: "/h",
  },
  {
    id: "hasil-gagal",
    group: "Hasil",
    title: "Evaluasi gagal",
    shell: "app",
    path: "/h",
  },

  {
    id: "pengaturan",
    group: "Akun",
    title: "Pengaturan",
    shell: "app",
    path: "/pengaturan",
  },
  {
    id: "pengaturan-demo",
    group: "Akun",
    title: "Pengaturan akun demo",
    shell: "app",
    path: "/pengaturan",
  },

  {
    id: "dialog",
    group: "Umpan balik",
    title: "Dialog konfirmasi",
    shell: "app",
    path: "/",
    capture: "viewport",
  },
  {
    id: "toast",
    group: "Umpan balik",
    title: "Toast",
    shell: "app",
    path: "/",
    capture: "viewport",
  },
];

export function findFrame(id: string): FrameMeta | undefined {
  return FRAMES.find((frame) => frame.id === id);
}
