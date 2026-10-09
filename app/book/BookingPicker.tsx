"use client";

import { useState } from "react";
import Link from "next/link";
import { formatJapaneseDate } from "@/lib/date";
import type { SlotStatus } from "@/lib/schedule";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export default function BookingPicker({
  weekOffset,
  weekDates,
  rowTimes,
  statusGrid,
  weekBasePath,
  nextBasePath,
}: {
  weekOffset: number;
  weekDates: string[];
  rowTimes: string[];
  statusGrid: Record<string, Record<string, SlotStatus>>;
  /** 週送りリンクのベースパス。実際のURLは `${weekBasePath}?week=N` になる */
  weekBasePath: string;
  /** 「〜で進む」リンクのベースパス。実際のURLは `${nextBasePath}?date=X&start=Y` になる */
  nextBasePath: string;
}) {
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-sand-600">
        <Link href={`${weekBasePath}?week=${weekOffset - 1}`} className="hover:text-sand-900">
          ‹ 前の週へ
        </Link>
        <span className="font-bold text-sand-800">
          {weekDates[0]} 〜 {weekDates[6]}
        </span>
        <Link href={`${weekBasePath}?week=${weekOffset + 1}`} className="hover:text-sand-900">
          次の週へ ›
        </Link>
      </div>

      {rowTimes.length === 0 ? (
        <p className="mt-4 text-sm text-sand-500">この週は予約可能な日がありません</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-sand-200 bg-white">
          <div
            className="grid min-w-[480px]"
            style={{ gridTemplateColumns: `56px repeat(${weekDates.length}, minmax(48px, 1fr))` }}
          >
            <div className="sticky left-0 z-20 border-b border-r border-sand-200 bg-sand-50" />
            {weekDates.map((date, i) => {
              const day = Number(date.slice(-2));
              const isSat = i === 5;
              const isSun = i === 6;
              return (
                <div
                  key={date}
                  className="border-b border-r border-sand-200 p-1.5 text-center text-xs font-bold"
                >
                  <div className={isSat ? "text-blue-600" : isSun ? "text-red-600" : "text-sand-700"}>
                    {day}
                  </div>
                  <div className="text-[10px] font-normal text-sand-400">{WEEKDAY_LABELS[i]}</div>
                </div>
              );
            })}

            {rowTimes.flatMap((time) => [
              <div
                key={`label-${time}`}
                className="sticky left-0 z-10 border-b border-r border-sand-100 bg-white p-1.5 text-[11px] text-sand-500"
              >
                {time}
              </div>,
              ...weekDates.map((date) => {
                const status = statusGrid[date]?.[time] ?? "closed";
                const isBookable = status === "available";
                const isSelected = selected?.date === date && selected?.time === time;

                return (
                  <div
                    key={`${date}-${time}`}
                    className="flex items-center justify-center border-b border-r border-sand-100 p-1"
                  >
                    <button
                      type="button"
                      disabled={!isBookable}
                      onClick={() => setSelected({ date, time })}
                      className={`h-7 w-7 rounded-md text-xs ${
                        isSelected
                          ? "bg-sage-600 font-bold text-white"
                          : isBookable
                            ? "text-sage-700 hover:bg-sage-50"
                            : "text-sand-200"
                      }`}
                    >
                      {isBookable ? "◎" : "×"}
                    </button>
                  </div>
                );
              }),
            ])}
          </div>
        </div>
      )}

      <div className="mt-5">
        {selected ? (
          <Link
            href={`${nextBasePath}?date=${selected.date}&start=${selected.time}`}
            className="block w-full rounded-lg bg-sage-600 px-4 py-3 text-center font-bold text-white hover:bg-sage-700"
          >
            {formatJapaneseDate(selected.date)} {selected.time}〜 で進む
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="block w-full cursor-not-allowed rounded-lg bg-sand-200 px-4 py-3 text-center font-bold text-sand-400"
          >
            日時を選択してください
          </button>
        )}
      </div>
    </div>
  );
}
