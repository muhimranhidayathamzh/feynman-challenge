export function TranscriptView({ transcript }: { transcript: string }) {
  if (!transcript.trim()) return null;

  return (
    <details className="card">
      <summary className="row-between">
        <span className="font-semibold">📝 Transkrip</span>
        <span className="text-muted text-sm">tampilkan / sembunyikan</span>
      </summary>
      <p
        className="text-secondary"
        style={{
          marginTop: "var(--space-4)",
          whiteSpace: "pre-wrap",
          lineHeight: "var(--leading-normal)",
        }}
      >
        {transcript}
      </p>
    </details>
  );
}
