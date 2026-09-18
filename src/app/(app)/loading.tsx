import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="stack gap-8" aria-busy="true" aria-label="Memuat dashboard">
      <div className="row-between flex-wrap gap-4">
        <div className="stack gap-2">
          <Skeleton width="14rem" height="2rem" radius="var(--radius-md)" />
          <Skeleton width="10rem" height="1rem" />
        </div>
        <Skeleton width="8rem" height="3rem" radius="var(--radius-full)" />
      </div>

      <div className="dashboard-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="9rem" radius="var(--radius-lg)" />
        ))}
      </div>
    </div>
  );
}
