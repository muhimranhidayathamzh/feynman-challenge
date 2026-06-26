import Link from "next/link";

export default function NotFound() {
  return (
    <main className="center" style={{ minHeight: "80vh", padding: "var(--space-4)" }}>
      <div
        className="card stack text-center"
        style={{ gap: "var(--space-4)", maxWidth: "28rem" }}
      >
        <span className="gradient-text" style={{ fontSize: "3rem", fontWeight: 700 }}>
          404
        </span>
        <h2>Halaman tidak ditemukan</h2>
        <p className="text-secondary">
          Tautan mungkin salah, atau challenge-nya sudah dihapus.
        </p>
        <Link href="/" className="btn btn-primary">
          Ke Dashboard
        </Link>
      </div>
    </main>
  );
}
