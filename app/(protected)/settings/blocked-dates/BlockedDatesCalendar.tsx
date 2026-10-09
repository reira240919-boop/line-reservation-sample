"use client";

import { useMemo, useState, useTransition } from "react";
import { buildMonthGrid } from "@/lib/date";
import { toggleBlockedDate } from "./actions";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function BlockedDatesCalendar({
  blockedDates,
  todayDate,
}: {
  blockedDates: string[];
  todayDate: string;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [isPending, startTransition] = useTransition();

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const [todayY, todayM] = todayDate.split("-").map(Number);
  const base = new Date(Date.UTC(todayY, todayM - 1, 1));
  base.setUTCMonth(base.getUTCMonth() + monthOffset);
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();

  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  function handleToggle(date: string) {
    if (date < todayDate) return;
    startTransition(() => {
      toggleBlockedDate(date);
    });
  }

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((v) => v - 1)}
          className="rounded-md px-2 py-1 text-sand-500 hover:bg-sage-50"
        >
          ‹ 前月
        </button>
        <p className="font-medium text-sand-800">
          {year}年{month + 1}月
        </p>
        <button
          type="button"
          onClick={() => setMonthOffset((v) => v + 1)}
          className="rounded-md px-2 py-1 text-sand-500 hover:bg-sage-50"
        >
          翌月 ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-sand-500">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${isPending ? "opacity-60" : ""}`}>
        {weeks.flatMap((week, wi) =>
          week.map((date, di) => {
            if (!date) return <div key={`${wi}-${di}`} />;

            const day = Number(date.slice(-2));
            const isPast = date < todayDate;
            const isBlocked = blockedSet.has(date);

            return (
              <button
                key={date}
                type="button"
                disabled={isPast}
                onClick={() => handleToggle(date)}
                className={`aspect-square rounded-md text-sm ${
                  isPast
                    ? "cursor-not-allowed text-sand-200"
                    : isBlocked
                      ? "bg-sand-100 text-sand-500 hover:bg-sand-200"
                      : "text-sand-800 hover:bg-sage-50"
                }`}
              >
                {isBlocked ? "×" : day}
              </button>
            );
          }),
        )}
      </div>

      <p className="mt-3 text-xs text-sand-400">
        日付をタップすると休み（×）を切り替えられます
      </p>
    </div>
  );
}
