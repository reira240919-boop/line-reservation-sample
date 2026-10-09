export const SLOT_STEP_MINUTES = 30;
export const SESSION_MINUTES = 60;
export const BUFFER_MINUTES = 30;

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 当日の枠について、あと何分前まで予約できるかを踏まえて「もう受付できないか」を判定する */
export function isBeyondBookingLeadTime(nowTime: string, slotStartTime: string, leadMinutes: number): boolean {
  return timeToMinutes(slotStartTime) < timeToMinutes(nowTime) + leadMinutes;
}

/** 開店〜閉店の間で、60分の施術が収まる30分刻みの開始時刻一覧を返す */
export function generateSlotStarts(openTime: string, closeTime: string): string[] {
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  const starts: string[] = [];
  for (let t = open; t + SESSION_MINUTES <= close; t += SLOT_STEP_MINUTES) {
    starts.push(minutesToTime(t));
  }
  return starts;
}

export type SlotStatus = "available" | "blocked_manual" | "blocked_booking" | "closed";

export function computeSlotStatus({
  startTime,
  dayAvailability,
  isDateFullyBlocked,
  manuallyBlockedTimes,
  bookingRanges,
  isPastTime = false,
}: {
  startTime: string;
  dayAvailability: { start_time: string; end_time: string } | undefined;
  isDateFullyBlocked: boolean;
  manuallyBlockedTimes: Set<string>;
  bookingRanges: { start: number; end: number }[];
  /** 対象の日が今日で、この時刻がすでに現在時刻を過ぎている場合に true */
  isPastTime?: boolean;
}): SlotStatus {
  if (isDateFullyBlocked || !dayAvailability || isPastTime) return "closed";

  const start = timeToMinutes(startTime);
  const end = start + SESSION_MINUTES;
  const openMinutes = timeToMinutes(dayAvailability.start_time);
  const closeMinutes = timeToMinutes(dayAvailability.end_time);
  if (start < openMinutes || end > closeMinutes) return "closed";

  const overlapsBooking = bookingRanges.some(
    (b) => start < b.end + BUFFER_MINUTES && end + BUFFER_MINUTES > b.start,
  );
  if (overlapsBooking) return "blocked_booking";

  if (manuallyBlockedTimes.has(startTime)) return "blocked_manual";

  return "available";
}
