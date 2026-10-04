import { Trash2 } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { SOURCE_TYPE_META } from "@/lib/utils/labels";
import { sourceLink } from "@/lib/utils/source-link";
import type { SourceType } from "@/types";

export interface SourceData {
  id: string;
  title: string;
  url: string | null;
  type: SourceType;
}

interface Props {
  source: SourceData;
  disabled: boolean;
  onRemove: (id: string) => void;
}

/**
 * One entry of the bibliography: the title, then its type and where it leads.
 * The title always opens something (V.11): the source's own page when it has
 * a URL, otherwise a search for it, and the small print says which.
 */
export function SourceItem({ source, disabled, onRemove }: Props) {
  const meta = SOURCE_TYPE_META[source.type];
  const link = sourceLink(source);

  return (
    <li className="source-entry">
      <div className="stack gap-1 flex-1">
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="source-title link-accent"
        >
          {source.title}
          <span className="visually-hidden">
            {link.kind === "search"
              ? " (membuka pencarian di tab baru)"
              : " (membuka tab baru)"}
          </span>
        </a>
        <span className="source-meta">
          {meta.label} · {link.label}
        </span>
      </div>
      <IconButton
        icon={Trash2}
        label={`Hapus sumber "${source.title}"`}
        danger
        onClick={() => onRemove(source.id)}
        disabled={disabled}
      />
    </li>
  );
}
