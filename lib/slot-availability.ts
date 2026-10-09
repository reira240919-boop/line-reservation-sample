import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { computeSlotStatus, timeToMinutes, isBeyondBookingLeadTime, type SlotStatus } from "./schedule";
import { todayJST, nowTimeJST } from "./date";

/**
 * その日時が今まさに予約可能かをDBの最新状態から判定する（予約確定直前の再チェック用）。
 * excludeBookingId を渡すと、その予約自身は「他の予約」として扱わない（日程変更時に使用）。
 */
export async function getSlotStatus(
  date: string,
  startTime: string,
  excludeBookingId?: string,
): Promise<SlotStatus> {
  const supabase = getSupabaseAdmin();
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();

  let bookingQuery = supabase
    .from("bookings")
    .select("start_time, end_time")
    .eq("date", date)
    .eq("status", "confirmed");
  if (excludeBookingId) {
    bookingQuery = bookingQuery.neq("id", excludeBookingId);
  }

  const [{ data: availRow }, { data: blockedRow }, { data: overrideRow }, { data: bookingRows }, { data: therapist }] =
    await Promise.all([
      supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("day_of_week", dow)
        .maybeSingle(),
      supabase.from("blocked_dates").select("id").eq("date", date).maybeSingle(),
      supabase
        .from("time_overrides")
        .select("id")
        .eq("date", date)
        .eq("start_time", startTime)
        .maybeSingle(),
      bookingQuery,
      supabase.from("therapists").select("min_booking_lead_minutes").limit(1).maybeSingle(),
    ]);

  const today = todayJST();
  const nowTime = nowTimeJST();
  const leadMinutes = therapist?.min_booking_lead_minutes ?? 60;

  return computeSlotStatus({
    startTime,
    dayAvailability: availRow
      ? { start_time: availRow.start_time.slice(0, 5), end_time: availRow.end_time.slice(0, 5) }
      : undefined,
    isDateFullyBlocked: !!blockedRow,
    manuallyBlockedTimes: overrideRow ? new Set([startTime]) : new Set(),
    bookingRanges: (bookingRows ?? []).map((b) => ({
      start: timeToMinutes(b.start_time.slice(0, 5)),
      end: timeToMinutes(b.end_time.slice(0, 5)),
    })),
    isPastTime: date === today && isBeyondBookingLeadTime(nowTime, startTime, leadMinutes),
  });
}
