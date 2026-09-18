import { Skeleton } from "@/components/ui/skeleton";

export default function ResultLoading() {
  return (
    <section className="page" aria-busy="true" aria-label="Memuat hasil evaluasi">
      <Skeleton width="50%" height="2rem" radius="var(--radius-md)" />
      <div className="card center">
        <Skeleton width="220px" height="220px" radius="var(--radius-full)" />
      </div>
      <Skeleton height="10rem" radius="var(--radius-lg)" />
      <Skeleton height="8rem" radius="var(--radius-lg)" />
    </section>
  );
}
