import { ScrollText } from "lucide-react";

import { Icon } from "@/components/ui/icon";

export function TranscriptView({ transcript }: { transcript: string }) {
  if (!transcript.trim()) return null;

  return (
    <details className="card">
      <summary className="row-between">
        <span className="row gap-2 font-semibold">
          <Icon icon={ScrollText} size={18} className="text-accent" />
          Transkrip
        </span>
        <span className="text-muted text-sm">tampilkan / sembunyikan</span>
      </summary>
      <p className="transcript-text text-secondary">{transcript}</p>
    </details>
  );
}
