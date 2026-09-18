import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Card, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  isEmptyComparison,
  studyHref,
  type CoverageChange,
  type CoverageComparison as Comparison,
} from "@/lib/utils/coverage-progress";
import { COVERAGE_STATUS_LABEL } from "@/lib/utils/labels";

import { COVERAGE_STATUS_META } from "./coverage-checklist";

interface Props {
  challengeId: string;
  previousAttemptNumber: number;
  comparison: Comparison;
}

function StatusText({ status }: { status: CoverageChange["from"] }) {
  return (
    <span className={COVERAGE_STATUS_META[status].className}>
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
      <h4 className="text-sm font-semibold">{title}</h4>
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

/** Point-by-point progress against the previous scored attempt. */
export function CoverageComparison({
  challengeId,
  previousAttemptNumber,
  comparison,
}: Props) {
  if (isEmptyComparison(comparison)) return null;

  const { improved, declined, stillWeak, steadyCount } = comparison;
  const summary = [
    improved.length > 0 && `${improved.length} membaik`,
    declined.length > 0 && `${declined.length} menurun`,
    stillWeak.length > 0 && `${stillWeak.length} masih kurang`,
    steadyCount > 0 && `${steadyCount} tetap tercakup`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card as="section" className="stack gap-4" aria-labelledby="compare-title">
      <div className="stack gap-1">
        <CardTitle icon={TrendingUp}>
          <span id="compare-title">Dibanding Percobaan #{previousAttemptNumber}</span>
        </CardTitle>
        <p className="text-secondary text-sm">{summary}</p>
      </div>

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
    </Card>
  );
}
