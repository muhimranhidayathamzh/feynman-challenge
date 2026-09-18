import { Trash2 } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
      <Icon icon={meta.icon} size={16} label={meta.label} className="source-type-icon" />
      <div className="flex-1">
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent text-sm"
          >
            {source.title}
            <span className="visually-hidden"> (membuka tab baru)</span>
          </a>
        ) : (
          <span className="text-sm">{source.title}</span>
        )}
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
