import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { todayJST, nowTimeJST, addDaysToDateString, weekRangeJST } from "./date";
import {
  generateSlotStarts,
  computeSlotStatus,
  timeToMinutes,
  isBeyondBookingLeadTime,
  type SlotStatus,
} from "./schedule";

export type WeekStatusGrid = {
  weekDates: string[];
  rowTimes: string[];
  statusGrid: Record<string, Record<string, SlotStatus>>;
};

/**
 * 指定した週の空き状況グリッドを組み立てる。
 * excludeBookingId を渡すと、その予約自身は「他の予約」として扱わない
 * （日程変更時、自分がもともと入っていた枠のせいで前後30分がブロックされるのを防ぐ）。
 */
export async function buildWeekStatusGrid(
  weekOffset: number,
  excludeBookingId?: string,
): Promise<WeekStatusGrid> {
  const supabase = getSupabaseAdmin();
  const { start, end } = weekRangeJST(weekOffset);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) weekDates.push(addDaysToDateString(start, i));

  let bookingQuery = supabase
    .from("bookings")
    .select("id, date, start_time, end_time")
    .eq("status", "confirmed")
    .gte("date", start)
    .lte("date", end);
  if (excludeBookingId) {
    bookingQuery = bookingQuery.neq("id", excludeBookingId);
  }

  const [{ data: availabilityRows }, { data: blockedRows }, { data: overrideRows }, { data: bookingRows }, { data: therapist }] =
    await Promise.all([
      supabase.from("availability").select("day_of_week, start_time, end_time"),
      supabase.from("blocked_dates").select("date").gte("date", start).lte("date", end),
      supabase.from("time_overrides").select("date, start_time").gte("date", start).lte("date", end),
      bookingQuery,
      supabase
        .from("therapists")
        .select("booking_window_days, min_booking_lead_minutes")
        .limit(1)
        .maybeSingle(),
    ]);

  const today = todayJST();
  const nowTime = nowTimeJST();
  const windowDays = therapist?.booking_window_days ?? 60;
  const leadMinutes = therapist?.min_booking_lead_minutes ?? 60;
  const lastBookableDate = addDaysToDateString(today, windowDays);

  const availabilityByDay = new Map<number, { start_time: string; end_time: string }>(
    (availabilityRows ?? []).map((r) => [
      r.day_of_week as number,
      { start_time: (r.start_time as string).slice(0, 5), end_time: (r.end_time as string).slice(0, 5) },
    ]),
  );
  const blockedDateSet = new Set((blockedRows ?? []).map((r) => r.date as string));

  const overridesByDate = new Map<string, Set<string>>();
  for (const row of overrideRows ?? []) {
    const set = overridesByDate.get(row.date as string) ?? new Set<string>();
    set.add((row.start_time as string).slice(0, 5));
    overridesByDate.set(row.date as string, set);
  }

  const bookingsByDate = new Map<string, { start: number; end: number }[]>();
  for (const row of bookingRows ?? []) {
    const list = bookingsByDate.get(row.date as string) ?? [];
    list.push({
      start: timeToMinutes((row.start_time as string).slice(0, 5)),
      end: timeToMinutes((row.end_time as string).slice(0, 5)),
    });
    bookingsByDate.set(row.date as string, list);
  }

  const rowTimesSet = new Set<string>();
  for (const date of weekDates) {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const dayAvail = availabilityByDay.get(dow);
    if (!dayAvail) continue;
    for (const t of generateSlotStarts(dayAvail.start_time, dayAvail.end_time)) {
      rowTimesSet.add(t);
    }
  }
  const rowTimes = Array.from(rowTimesSet).sort();

  const statusGrid: Record<string, Record<string, SlotStatus>> = {};
  for (const date of weekDates) {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const dayAvail = availabilityByDay.get(dow);
    const outOfWindow = date < today || date > lastBookableDate;
    const row: Record<string, SlotStatus> = {};
    for (const time of rowTimes) {
      row[time] = outOfWindow
        ? "closed"
        : computeSlotStatus({
            startTime: time,
            dayAvailability: dayAvail,
            isDateFullyBlocked: blockedDateSet.has(date),
            manuallyBlockedTimes: overridesByDate.get(date) ?? new Set<string>(),
            bookingRanges: bookingsByDate.get(date) ?? [],
            isPastTime: date === today && isBeyondBookingLeadTime(nowTime, time, leadMinutes),
          });
    }
    statusGrid[date] = row;
  }

  return { weekDates, rowTimes, statusGrid };
}
