import { Trash2 } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { SOURCE_TYPE_META } from "@/lib/utils/labels";
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

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www[.]/, "");
  } catch {
    return null;
  }
}

/** One entry of the bibliography: title, then type and site in small print. */
export function SourceItem({ source, disabled, onRemove }: Props) {
  const meta = SOURCE_TYPE_META[source.type];
  const site = source.url ? hostname(source.url) : null;

  return (
    <li className="source-entry">
      <div className="stack gap-1 flex-1">
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-title link-accent"
          >
            {source.title}
            <span className="visually-hidden"> (membuka tab baru)</span>
          </a>
        ) : (
          <span className="source-title">{source.title}</span>
        )}
        <span className="source-meta">
          {meta.label}
          {site ? ` · ${site}` : ""}
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
