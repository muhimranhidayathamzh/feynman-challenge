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

export function SourceItem({ source, disabled, onRemove }: Props) {
  const meta = SOURCE_TYPE_META[source.type];

  return (
    <li className="source-row">
      <span aria-hidden="true" title={meta.label}>
        {meta.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-sm"
          >
            {source.title}
          </a>
        ) : (
          <span className="text-sm">{source.title}</span>
        )}
      </div>
      <button
        type="button"
        className="icon-btn"
        data-danger="true"
        onClick={() => onRemove(source.id)}
        disabled={disabled}
        aria-label="Hapus sumber"
        title="Hapus"
      >
        🗑️
      </button>
    </li>
  );
}
