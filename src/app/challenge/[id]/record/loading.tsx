import { Skeleton } from "@/components/ui/skeleton";

export default function RecordLoading() {
  return (
    <main className="record-shell">
      <Skeleton width="60%" height="1.5rem" radius="var(--radius-md)" />
      <Skeleton width="220px" height="220px" radius="var(--radius-full)" />
      <Skeleton height="120px" radius="var(--radius-lg)" />
      <Skeleton width="12rem" height="3.5rem" radius="var(--radius-md)" />
    </main>
  );
}
