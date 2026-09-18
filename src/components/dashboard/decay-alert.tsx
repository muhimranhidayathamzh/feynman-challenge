import Link from "next/link";
import { Leaf } from "lucide-react";

import { Icon } from "@/components/ui/icon";

export interface DecayItem {
  id: string;
  title: string;
  daysSinceReview: number;
}

export function DecayAlert({ items }: { items: DecayItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="stack gap-3" aria-labelledby="decay-title">
      <h2 id="decay-title" className="section-title">
        <Icon icon={Leaf} size={20} />
        Perlu Diulang
      </h2>
      <div className="stack gap-2">
        {items.map((item) => (
          <Link key={item.id} href={`/challenge/${item.id}`} className="alert-row">
            <span className="font-medium">{item.title}</span>
            <span className="text-sm nowrap text-warning">
              {item.daysSinceReview} hari sejak latihan terakhir
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
