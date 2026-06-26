import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengeLoading() {
  return (
    <section
      className="stack"
      style={{ gap: "var(--space-6)", maxWidth: "44rem", marginInline: "auto" }}
    >
      <div className="stack" style={{ gap: "var(--space-3)" }}>
        <Skeleton width="60%" height="2.25rem" radius="var(--radius-md)" />
        <Skeleton width="12rem" height="1.5rem" radius="var(--radius-full)" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height="8rem" radius="var(--radius-lg)" />
      ))}
      <Skeleton height="3.5rem" radius="var(--radius-md)" />
    </section>
  );
}
