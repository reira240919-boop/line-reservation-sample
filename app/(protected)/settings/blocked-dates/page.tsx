import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { todayJST, weekRangeJST, addDaysToDateString } from "@/lib/date";
import { generateSlotStarts, computeSlotStatus, timeToMinutes, type SlotStatus } from "@/lib/schedule";
import BlockedDatesCalendar from "./BlockedDatesCalendar";
import BlockedRangeForm from "./BlockedRangeForm";
import TimeGrid from "./TimeGrid";

export const dynamic = "force-dynamic";

type Tab = "day" | "time";

export default async function BlockedDatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string }>;
}) {
  const { tab: tabParam, week: weekParam } = await searchParams;
  const tab: Tab = tabParam === "day" ? "day" : "time";
  const weekOffset = Number(weekParam ?? 0) || 0;

  const supabase = getSupabaseAdmin();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sand-900">予約枠管理</h1>
      <Tabs tab={tab} />

      {tab === "day" ? (
        <DayTab supabase={supabase} />
      ) : (
        <TimeTab supabase={supabase} weekOffset={weekOffset} />
      )}

      <p className="mt-6 text-sm">
        <Link
          href="/preview/booking-calendar"
          className="text-sand-500 underline hover:text-sand-800"
        >
          お客様側の見え方サンプルを見る →
        </Link>
      </p>
    </div>
  );
}

function Tabs({ tab }: { tab: Tab }) {
  return (
    <div className="mt-4 flex gap-2 border-b border-sand-200">
      <Link
        href="/settings/blocked-dates?tab=day"
        className={`px-4 py-2 text-sm font-medium ${
          tab === "day"
            ? "border-b-2 border-sage-600 text-sage-800"
            : "text-sand-500 hover:text-sand-800"
        }`}
      >
        日にちで管理
      </Link>
      <Link
        href="/settings/blocked-dates?tab=time"
        className={`px-4 py-2 text-sm font-medium ${
          tab === "time"
            ? "border-b-2 border-sage-600 text-sage-800"
            : "text-sand-500 hover:text-sand-800"
        }`}
      >
        時間で管理
      </Link>
    </div>
  );
}

async function DayTab({ supabase }: { supabase: SupabaseClient }) {
  const { data } = await supabase.from("blocked_dates").select("date");
  const blockedDates = (data ?? []).map((row: { date: string }) => row.date);

  return (
    <>
      <p className="mt-4 text-sm text-sand-500">
        カレンダーの日付をタップして休みを設定・解除できます。
      </p>

      <div className="mt-4">
        <BlockedDatesCalendar blockedDates={blockedDates} todayDate={todayJST()} />
      </div>

      <div className="mt-6 rounded-lg border border-sand-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-sand-700">期間でまとめて休みにする</p>
        <BlockedRangeForm />
      </div>
    </>
  );
}

async function TimeTab({
  supabase,
  weekOffset,
}: {
  supabase: SupabaseClient;
  weekOffset: number;
}) {
  const { start, end } = weekRangeJST(weekOffset);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) weekDates.push(addDaysToDateString(start, i));

  const [
    { data: availabilityRows },
    { data: blockedRows },
    { data: overrideRows },
    { data: bookingRows },
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
  ]);

  const availabilityByDay = new Map<number, { start_time: string; end_time: string }>(
    (availabilityRows ?? []).map((r: { day_of_week: number; start_time: string; end_time: string }) => [
      r.day_of_week,
      { start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5) },
    ]),
  );
  const blockedDateSet = new Set((blockedRows ?? []).map((r: { date: string }) => r.date));

  const overridesByDate = new Map<string, Set<string>>();
  for (const row of (overrideRows ?? []) as { date: string; start_time: string }[]) {
    const set = overridesByDate.get(row.date) ?? new Set<string>();
    set.add(row.start_time.slice(0, 5));
    overridesByDate.set(row.date, set);
  }

  const bookingsByDate = new Map<string, { start: number; end: number }[]>();
  for (const row of (bookingRows ?? []) as { date: string; start_time: string; end_time: string }[]) {
    const list = bookingsByDate.get(row.date) ?? [];
    list.push({
      start: timeToMinutes(row.start_time.slice(0, 5)),
      end: timeToMinutes(row.end_time.slice(0, 5)),
    });
    bookingsByDate.set(row.date, list);
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
    const row: Record<string, SlotStatus> = {};
    for (const time of rowTimes) {
      row[time] = computeSlotStatus({
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
    <>
      <p className="mt-4 text-sm text-sand-500">
        30分ごとに受付できる時間を個別に設定できます。◎＝予約可、×＝予約不可（タップで切替）。予約や休みで自動的に×になっているマスは変更できません。
      </p>

      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/settings/blocked-dates?tab=time&week=${weekOffset - 1}`}
          className="text-sm text-sand-500 hover:text-sand-800"
        >
          ‹ 前の週へ
        </Link>
        <p className="text-sm font-medium text-sand-800">
          {weekDates[0]} 〜 {weekDates[6]}
        </p>
        <Link
          href={`/settings/blocked-dates?tab=time&week=${weekOffset + 1}`}
          className="text-sm text-sand-500 hover:text-sand-800"
        >
          次の週へ ›
        </Link>
      </div>

      <div className="mt-4">
        {rowTimes.length === 0 ? (
          <p className="text-sm text-sand-500">
            この週は受付可能な曜日がありません（空き時間設定をご確認ください）
          </p>
        ) : (
          <TimeGrid weekDates={weekDates} rowTimes={rowTimes} statusGrid={statusGrid} />
        )}
      </div>
    </>
  );
}
