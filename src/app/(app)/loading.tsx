import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="stack" style={{ gap: "var(--space-8)" }}>
      <div className="row-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div className="stack" style={{ gap: "var(--space-2)" }}>
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
