export default function Home() {
  return (
    <main className="container center" style={{ minHeight: "100dvh" }}>
      <section
        className="glass animate-fade-in-up stack text-center"
        style={{ maxWidth: "32rem", alignItems: "center" }}
      >
        <span className="badge">🧠 Feynman Challenge</span>
        <h1 className="gradient-text">Jelaskan ulang. Kuasai beneran.</h1>
        <p className="text-secondary">
          Kalau kamu nggak bisa menjelaskannya, kamu belum paham. Foundation
          siap — design system aktif.
        </p>
        <div className="row" style={{ marginTop: "var(--space-2)" }}>
          <button className="btn btn-primary btn-lg">Mulai</button>
          <button className="btn btn-ghost btn-lg">Pelajari</button>
        </div>
      </section>
    </main>
  );
}
