"use client";

import { useFormStatus } from "react-dom";
import { createBookingAction } from "./actions";

const CONCERN_OPTIONS = ["人間関係", "仕事", "お金", "体調", "恋愛・パートナー"];

export default function BookingForm({ date, start }: { date: string; start: string }) {
  return (
    <form action={createBookingAction} className="mt-5 space-y-5">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="start" value={start} />

      <div>
        <label htmlFor="name" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-sand-800">
          お名前
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-500">
            必須
          </span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="例）山田 花子"
          className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-sand-800">
          相談したい悩み
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-500">
            必須
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CONCERN_OPTIONS.map((option) => (
            <label key={option} className="cursor-pointer">
              <input type="checkbox" name="concerns" value={option} className="peer sr-only" />
              <span className="inline-block rounded-full border border-sand-300 px-3.5 py-2 text-sm text-sand-600 peer-checked:border-sage-600 peer-checked:bg-sage-100 peer-checked:font-bold peer-checked:text-sage-800">
                {option}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-sand-400">複数選択できます</p>
      </div>

      <div>
        <label
          htmlFor="comment"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-sand-800"
        >
          コメント
          <span className="rounded bg-sand-100 px-1.5 py-0.5 text-[11px] font-medium text-sand-500">
            任意
          </span>
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          placeholder="伝えておきたいことがあればご記入ください"
          className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
        />
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-sage-600 px-4 py-3 font-bold text-white hover:bg-sage-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {pending ? "送信中…" : "この内容で予約する"}
    </button>
  );
}
