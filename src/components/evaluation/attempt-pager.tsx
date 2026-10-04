import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import type { AttemptLink } from "@/lib/utils/attempt-history";

interface Props {
  challengeId: string;
  previous: AttemptLink | null;
  next: AttemptLink | null;
  /** Spell out "Percobaan #N" where no eyebrow names the current attempt. */
  spelled?: boolean;
}

/**
 * Step to the attempt before or after this one (Prompt 4.1), whatever state
 * it is in. Renders nothing for a challenge with a single attempt.
 */
export function AttemptPager({ challengeId, previous, next, spelled = false }: Props) {
  if (!previous && !next) return null;
  // Screen readers hear "Percobaan sebelumnya: #3" or, spelled out,
  // "Sebelumnya: Percobaan #3".
  const word = spelled ? "Percobaan " : "";
  const side = (label: string) =>
    spelled ? `${label}: ` : `Percobaan ${label.toLowerCase()}: `;
  const href = (attempt: AttemptLink) => `/challenge/${challengeId}/result/${attempt.id}`;

  return (
    <nav className="attempt-pager" aria-label="Percobaan lain">
      {previous && (
        <Link href={href(previous)} rel="prev" className="attempt-pager-link">
          <Icon icon={ChevronLeft} size={16} />
          <span className="visually-hidden">{side("Sebelumnya")}</span>
          {`${word}#${previous.number}`}
        </Link>
      )}
      {next && (
        <Link href={href(next)} rel="next" className="attempt-pager-link">
          <span className="visually-hidden">{side("Berikutnya")}</span>
          {`${word}#${next.number}`}
          <Icon icon={ChevronRight} size={16} />
        </Link>
      )}
    </nav>
  );
}
