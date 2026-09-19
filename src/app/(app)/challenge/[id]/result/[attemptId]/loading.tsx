import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the result layout: summary, score sheet, points beside transcript. */
export default function ResultLoading() {
  return (
    <section
      className="page result-page"
      aria-busy="true"
      aria-label="Memuat hasil evaluasi"
    >
      <div className="stack gap-2">
        <Skeleton width="30%" height="1rem" />
        <Skeleton width="80%" height="2rem" />
        <Skeleton width="55%" height="2rem" />
      </div>
      <div className="sheet result-score">
        <Skeleton width="10rem" height="4rem" />
        <div className="stack gap-3">
          <Skeleton height="0.5rem" />
          <Skeleton height="0.5rem" />
          <Skeleton height="0.5rem" />
        </div>
      </div>
      <div className="result-evidence">
        <Skeleton height="16rem" radius="var(--radius-lg)" />
        <Skeleton height="16rem" radius="var(--radius-lg)" />
      </div>
    </section>
  );
}
