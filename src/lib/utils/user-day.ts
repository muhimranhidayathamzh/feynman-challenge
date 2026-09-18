import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { DEFAULT_TIMEZONE, calendarDay, type CalendarDay } from "@/lib/utils/date";
import type { Database } from "@/types";

export interface UserClock {
  timeZone: string;
  /** The instant this was computed. */
  now: Date;
  /** `now` as a calendar day in the user's timezone. */
  today: CalendarDay;
}

/**
 * The user's timezone and current calendar day, for server code that must
 * reason about "today" (dashboard, notebook, evaluation).
 */
export async function getUserClock(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserClock> {
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  const timeZone = data?.timezone ?? DEFAULT_TIMEZONE;
  const now = new Date();
  return { timeZone, now, today: calendarDay(now, timeZone) };
}
