"use client";

import { useActionState } from "react";
import { saveAvailabilityAction } from "./actions";
import { INITIAL_SAVE_STATE } from "@/lib/save-state";
import SaveStatus from "@/components/SaveStatus";

const DAY_LABELS: { day: number; label: string }[] = [
  { day: 1, label: "月" },
  { day: 2, label: "火" },
  { day: 3, label: "水" },
  { day: 4, label: "木" },
  { day: 5, label: "金" },
  { day: 6, label: "土" },
  { day: 0, label: "日" },
];

type AvailabilityRow = { day_of_week: number; start_time: string; end_time: string };

export default function AvailabilityForm({
  byDay,
  bookingWindowDays,
  minBookingLeadMinutes,
}: {
  byDay: Map<number, AvailabilityRow>;
  bookingWindowDays: number;
  minBookingLeadMinutes: number;
}) {
  const [state, formAction, pending] = useActionState(saveAvailabilityAction, INITIAL_SAVE_STATE);

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white px-4 py-3">
        <label htmlFor="booking_window_days" className="text-sm font-medium text-sand-700">
          受付期間：今日から
        </label>
        <input
          id="booking_window_days"
          name="booking_window_days"
          type="number"
          min={1}
          max={365}
          defaultValue={bookingWindowDays}
          className="w-20 rounded-md border border-sand-300 px-2 py-1 text-right focus:border-sage-500 focus:outline-none"
        />
        <span className="text-sm text-sand-700">日先まで受付</span>
      </div>

      <div className="rounded-lg border border-sand-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="min_booking_lead_minutes" className="text-sm font-medium text-sand-700">
            当日の予約：開始の
          </label>
          <input
            id="min_booking_lead_minutes"
            name="min_booking_lead_minutes"
            type="number"
            min={0}
            max={1440}
            defaultValue={minBookingLeadMinutes}
            className="w-20 rounded-md border border-sand-300 px-2 py-1 text-right focus:border-sage-500 focus:outline-none"
          />
          <span className="text-sm text-sand-700">分前まで受付</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-sand-400">
          例：60分に設定すると、10:00開始の枠は当日9:00を過ぎると予約できなくなります。
        </p>
      </div>

      {DAY_LABELS.map(({ day, label }) => {
        const row = byDay.get(day);
        return (
          <div
            key={day}
            className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white px-4 py-3"
          >
            <span className="w-6 font-medium text-sand-800">{label}</span>
            <input
              type="time"
              name={`start_${day}`}
              defaultValue={row?.start_time?.slice(0, 5) ?? ""}
              className="rounded-md border border-sand-300 px-2 py-1 focus:border-sage-500 focus:outline-none"
            />
            <span className="text-sand-400">〜</span>
            <input
              type="time"
              name={`end_${day}`}
              defaultValue={row?.end_time?.slice(0, 5) ?? ""}
              className="rounded-md border border-sand-300 px-2 py-1 focus:border-sage-500 focus:outline-none"
            />
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700 disabled:opacity-60"
        >
          保存する
        </button>
        <SaveStatus state={state} pending={pending} />
      </div>
    </form>
  );
}
