import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  todayJST,
  nowTimeJST,
  currentWeekRangeJST,
  addDaysToDateString,
  formatJapaneseDate,
} from "@/lib/date";
import CancelButton from "./CancelButton";
import MemoForm from "./MemoForm";
import { toggleContractedAction } from "./actions";

export const dynamic = "force-dynamic";

type Tab = "today" | "week" | "all" | "consulted";

type Booking = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  concerns: string[];
  status: "confirmed" | "cancelled";
  contracted: boolean;
  memo: string | null;
};

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "week", label: "今週" },
  { key: "all", label: "すべて" },
  { key: "consulted", label: "相談済み" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab =
    tabParam === "week" || tabParam === "all" || tabParam === "consulted" ? tabParam : "today";

  const supabase = getSupabaseAdmin();
  const today = todayJST();
  const nowTime = nowTimeJST();
  const tomorrow = addDaysToDateString(today, 1);
  const { start: weekStart, end: weekEnd } = currentWeekRangeJST();

  const baseSelect =
    "id, date, start_time, end_time, client_name, concerns, status, contracted, memo";

  let listQuery = supabase.from("bookings").select(baseSelect);

  if (tab === "today") {
    listQuery = listQuery
      .eq("date", today)
      .order("start_time", { ascending: true });
  } else if (tab === "week") {
    listQuery = listQuery
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
  } else if (tab === "consulted") {
    listQuery = listQuery
      .eq("status", "confirmed")
      .lte("date", today)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });
  } else {
    listQuery = listQuery.order("date", { ascending: true }).order("start_time", { ascending: true });
  }

  const [{ data: rawBookings, error }, todayCount, weekCount, allCount] = await Promise.all([
    listQuery,
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("date", today),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("date", weekStart)
      .lte("date", weekEnd),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);

  let bookings = (rawBookings ?? []) as Booking[];
  if (tab === "consulted") {
    bookings = bookings.filter(
      (b) => b.date < today || (b.date === today && b.end_time.slice(0, 5) <= nowTime),
    );
  }

  const groups = groupByDate(bookings);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sand-900">予約一覧</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto border-b border-sand-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard?tab=${t.key}`}
            className={`shrink-0 px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-b-2 border-sage-600 text-sage-800"
                : "text-sand-500 hover:text-sand-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab !== "consulted" && (
        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-sand-200 bg-sand-200">
          <SummaryCell label="今日の予約" value={todayCount.count ?? 0} />
          <SummaryCell label="今週の予約" value={weekCount.count ?? 0} />
          <SummaryCell label="すべての予約" value={allCount.count ?? 0} />
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-sand-200 bg-white">
        {error && (
          <p className="m-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            予約の取得に失敗しました: {error.message}
          </p>
        )}
        {!error && groups.length === 0 && (
          <p className="p-6 text-sm text-sand-500">
            {tab === "consulted" ? "相談済みの予約はまだありません" : "予約はありません"}
          </p>
        )}
        {groups.map((group, gi) => {
          const rel = group.date === today ? "今日" : group.date === tomorrow ? "明日" : null;
          return (
            <div key={group.date}>
              <div
                className={`flex items-baseline gap-2 px-4 pb-1.5 pt-3.5 text-sm font-bold text-sand-600 ${
                  gi === 0 ? "" : "border-t border-sand-100"
                }`}
              >
                {rel && (
                  <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-sage-700">
                    {rel}
                  </span>
                )}
                {formatJapaneseDate(group.date)}
              </div>
              {group.bookings.map((b, bi) => (
                <div
                  key={b.id}
                  className={`px-4 py-2.5 ${bi === 0 ? "" : "border-t border-sand-100"}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-8 w-[3px] shrink-0 rounded-full ${b.status === "cancelled" ? "bg-sand-200" : "bg-sage-600"}`}
                    />
                    <div
                      className={`w-14 shrink-0 font-bold ${b.status === "cancelled" ? "text-sand-300 line-through decoration-sand-300" : "text-sand-900"}`}
                    >
                      {b.start_time.slice(0, 5)}
                      <span className="block text-xs font-normal text-sand-400">
                        〜{b.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${b.status === "cancelled" ? "text-sand-300 line-through decoration-sand-300" : "text-sand-900"}`}
                      >
                        {b.client_name}
                        {b.concerns?.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-sand-400">
                            {b.concerns.join("・")}
                          </span>
                        )}
                      </p>
                    </div>

                    {tab === "consulted" ? (
                      <form action={toggleContractedAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <button
                          type="submit"
                          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                            b.contracted
                              ? "border-sage-600 bg-sage-100 text-sage-800"
                              : "border-sand-200 text-sand-400 hover:bg-sand-50"
                          }`}
                        >
                          <span
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded ${
                              b.contracted ? "bg-sage-600 text-white" : "border border-sand-300"
                            }`}
                          >
                            {b.contracted ? "✓" : ""}
                          </span>
                          契約成立
                        </button>
                      </form>
                    ) : b.status === "cancelled" ? (
                      <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-500">
                        キャンセル済み
                      </span>
                    ) : (
                      <>
                        <span className="hidden shrink-0 rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-bold text-sage-700 sm:inline-block">
                          予約中
                        </span>
                        <CancelButton id={b.id} />
                      </>
                    )}
                  </div>

                  {tab === "consulted" && <MemoForm bookingId={b.id} initialMemo={b.memo ?? ""} />}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-sand-50 px-3.5 py-2.5">
      <div className="font-bold text-sand-900" style={{ fontSize: "1.35rem" }}>
        {value}
      </div>
      <div className="text-xs text-sand-500">{label}</div>
    </div>
  );
}

function groupByDate(bookings: Booking[]): { date: string; bookings: Booking[] }[] {
  const map = new Map<string, Booking[]>();
  for (const b of bookings) {
    const list = map.get(b.date) ?? [];
    list.push(b);
    map.set(b.date, list);
  }
  return Array.from(map.entries()).map(([date, list]) => ({ date, bookings: list }));
}
