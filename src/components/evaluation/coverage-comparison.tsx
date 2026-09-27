import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { Disclosure } from "@/components/ui/disclosure";
import { Icon } from "@/components/ui/icon";
import {
  isEmptyComparison,
  studyHref,
  type CoverageChange,
  type CoverageComparison as Comparison,
} from "@/lib/utils/coverage-progress";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";
import { comparisonSummary } from "@/lib/utils/result-digest";

import { CoverageMark } from "./coverage-mark";

interface Props {
  challengeId: string;
  previousAttemptNumber: number;
  comparison: Comparison;
}

function StatusText({ status }: { status: CoverageChange["from"] }) {
  return (
    <span className="compare-state">
      <CoverageMark status={status} size={14} decorative />
      {COVERAGE_STATUS_LABEL[status]}
    </span>
  );
}

function ChangeList({
  title,
  changes,
  challengeId,
  showStudy,
}: {
  title: string;
  changes: CoverageChange[];
  challengeId: string;
  showStudy: boolean;
}) {
  if (changes.length === 0) return null;
  return (
    <div className="stack gap-2">
      <h3 className="notes-heading">{title}</h3>
      <ul className="stack gap-2">
        {changes.map((change) => (
          <li key={`${change.topic}-${change.outlineId ?? ""}`} className="compare-row">
            <span className="font-medium">{change.topic}</span>
            <span className="compare-status text-sm">
              <StatusText status={change.from} />
              <Icon icon={ArrowRight} size={12} label="menjadi" />
              <StatusText status={change.to} />
            </span>
            {showStudy && change.outlineId !== null && (
              <Link
                href={studyHref(challengeId, change.outlineId)}
                className="compare-link text-sm"
                aria-label={`Pelajari lagi: ${change.topic}`}
              >
                <Icon icon={BookOpen} size={14} />
                Pelajari lagi
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Point-by-point progress against the previous scored attempt. Folded by
 * default (Prompt V.7); the summary line keeps the verdict visible.
 */
export function CoverageComparison({
  challengeId,
  previousAttemptNumber,
  comparison,
}: Props) {
  if (isEmptyComparison(comparison)) return null;

  const { improved, declined, stillWeak } = comparison;

  return (
    <Disclosure
      title={`Dibanding percobaan #${previousAttemptNumber}`}
      summary={comparisonSummary(comparison)}
    >
      <ChangeList
        title="Membaik"
        changes={improved}
        challengeId={challengeId}
        showStudy={false}
      />
      <ChangeList
        title="Menurun"
        changes={declined}
        challengeId={challengeId}
        showStudy
      />
      <ChangeList
        title="Masih kurang"
        changes={stillWeak}
        challengeId={challengeId}
        showStudy
      />

      {improved.length === 0 && declined.length === 0 && stillWeak.length === 0 && (
        <p className="text-sm">Semua poin tetap tercakup. Pertahankan!</p>
      )}
    </Disclosure>
  );
}
