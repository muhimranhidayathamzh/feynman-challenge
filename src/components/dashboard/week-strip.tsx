import type { WeekDay } from "@/lib/utils/streak";

interface Props {
  days: WeekDay[];
  /** Live streak length (0 when broken). */
  streak: number;
}

function status(day: WeekDay): string {
  if (day.active) return "sudah menjelaskan";
  if (day.isToday) return "hari ini, belum";
  if (day.isFuture) return "belum tiba";
  return "tidak ada";
}

/**
 * This week at a glance (DESIGN.md §10), replacing the flame badge. Days of
 * the current streak are inked; today has a vermilion edge until it counts.
 */
export function WeekStrip({ days, streak }: Props) {
  return (
    <div className="week-strip">
      <ol className="week-days" aria-label="Minggu ini">
        {days.map((day) => (
          <li
            key={day.day}
            className="week-day"
            data-active={day.active || undefined}
            data-today={day.isToday || undefined}
            data-future={day.isFuture || undefined}
            title={day.name}
          >
            <span aria-hidden="true">{day.short}</span>
            <span className="visually-hidden">
              {day.name}: {status(day)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm">
        {streak > 0 ? (
          <>
            <span className="font-semibold">{streak} hari</span>{" "}
            <span className="text-secondary">berturut-turut</span>
          </>
        ) : (
          <span className="text-secondary">
            Jelaskan satu topik hari ini untuk memulai.
          </span>
        )}
      </p>
    </div>
  );
}
