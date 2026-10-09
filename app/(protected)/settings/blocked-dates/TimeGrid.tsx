"use client";

import { useTransition } from "react";
import { toggleTimeSlotOverride } from "./actions";
import type { SlotStatus } from "@/lib/schedule";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export default function TimeGrid({
  weekDates,
  rowTimes,
  statusGrid,
}: {
  weekDates: string[];
  rowTimes: string[];
  statusGrid: Record<string, Record<string, SlotStatus>>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick(date: string, time: string, status: SlotStatus) {
    if (status !== "available" && status !== "blocked_manual") return;
    startTransition(() => {
      toggleTimeSlotOverride(date, time);
    });
  }

  return (
    <div
      className={`overflow-x-auto rounded-lg border border-sand-200 bg-white ${
        isPending ? "opacity-60" : ""
      }`}
    >
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
            <div key={date} className="border-b border-r border-sand-200 p-2 text-center font-medium">
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
            const isEditable = status === "available" || status === "blocked_manual";
            const mark = status === "available" ? "◎" : "×";

            return (
              <div
                key={`${date}-${time}`}
                className="flex items-center justify-center border-b border-r border-sand-100 p-1"
              >
                <button
                  type="button"
                  disabled={!isEditable}
                  onClick={() => handleClick(date, time, status)}
                  className={`h-7 w-7 rounded-md text-xs ${
                    status === "available"
                      ? "text-sage-700 hover:bg-sage-50"
                      : status === "blocked_manual"
                        ? "text-sand-400 hover:bg-sand-100"
                        : status === "blocked_booking"
                          ? "text-sand-300"
                          : "text-sand-200"
                  }`}
                >
                  {mark}
                </button>
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}
