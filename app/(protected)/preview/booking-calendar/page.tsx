import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { todayJST, addDaysToDateString, weekRangeJST } from "@/lib/date";
import { generateSlotStarts, computeSlotStatus, timeToMinutes, type SlotStatus } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export default async function BookingCalendarPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const weekOffset = Number(weekParam ?? 0) || 0;

  const supabase = getSupabaseAdmin();
  const { start, end } = weekRangeJST(weekOffset);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) weekDates.push(addDaysToDateString(start, i));

  const [
    { data: availabilityRows },
    { data: blockedRows },
    { data: overrideRows },
    { data: bookingRows },
    { data: therapist },
  ] = await Promise.all([
    supabase.from("availability").select("day_of_week, start_time, end_time"),
    supabase.from("blocked_dates").select("date").gte("date", start).lte("date", end),
    supabase.from("time_overrides").select("date, start_time").gte("date", start).lte("date", end),
    supabase
      .from("bookings")
      .select("date, start_time, end_time")
      .eq("status", "confirmed")
      .gte("date", start)
      .lte("date", end),
    supabase.from("therapists").select("booking_window_days").limit(1).maybeSingle(),
  ]);

  const today = todayJST();
  const windowDays = therapist?.booking_window_days ?? 60;
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
          });
    }
    statusGrid[date] = row;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/settings/blocked-dates" className="text-sm text-sand-400 hover:text-sand-600">
        ← 休み設定に戻る
      </Link>

      <p className="mt-3 inline-block rounded bg-sand-100 px-2 py-1 text-xs font-medium text-sand-700">
        サンプル（イメージ）※実際の予約機能はStep 2で実装します
      </p>
      <h1 className="mt-3 text-xl font-bold text-sand-900">ご希望の日時を選んでください</h1>

      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/preview/booking-calendar?week=${weekOffset - 1}`}
          className="text-sm text-sand-500 hover:text-sand-800"
        >
          ‹ 前の週へ
        </Link>
        <p className="text-sm font-medium text-sand-800">
          {weekDates[0]} 〜 {weekDates[6]}
        </p>
        <Link
          href={`/preview/booking-calendar?week=${weekOffset + 1}`}
          className="text-sm text-sand-500 hover:text-sand-800"
        >
          次の週へ ›
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-sand-200 bg-white">
        {rowTimes.length === 0 ? (
          <p className="p-4 text-sm text-sand-500">この週は予約可能な曜日がありません</p>
        ) : (
          <div
            className="grid min-w-[560px]"
            style={{ gridTemplateColumns: `64px repeat(${weekDates.length}, minmax(56px, 1fr))` }}
          >
            <div className="sticky left-0 z-20 border-b border-r border-sand-200 bg-sand-50" />
            {weekDates.map((date, i) => {
              const day = Number(date.slice(-2));
              const isSat = i === 5;
              const isSun = i === 6;
              return (
                <div
                  key={date}
                  className="border-b border-r border-sand-200 p-2 text-center font-medium"
                >
                  <div className={isSat ? "text-blue-600" : isSun ? "text-red-600" : "text-sand-700"}>
                    {day}
                  </div>
                  <div className="text-xs text-sand-400">{WEEKDAY_LABELS[i]}</div>
                </div>
              );
            })}

            {rowTimes.flatMap((time) => [
              <div
                key={`label-${time}`}
                className="sticky left-0 z-10 border-b border-r border-sand-100 bg-white p-2 text-xs text-sand-500"
              >
                {time}
              </div>,
              ...weekDates.map((date) => {
                const status = statusGrid[date]?.[time] ?? "closed";
                const isBookable = status === "available";
                return (
                  <div
                    key={`${date}-${time}`}
                    className="flex items-center justify-center border-b border-r border-sand-100 p-1"
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs ${
                        isBookable ? "cursor-pointer text-sage-700 hover:bg-sage-50" : "text-sand-300"
                      }`}
                    >
                      {isBookable ? "◎" : "×"}
                    </span>
                  </div>
                );
              }),
            ])}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-sand-400">
        受付期間：今日から{windowDays}
        日先まで。実際は◎の枠を選ぶと名前などの入力に進みます。
      </p>
    </div>
  );
}
