"use client";

import { useFormStatus } from "react-dom";
import { confirmRescheduleAction } from "./actions";

export default function RescheduleConfirmForm({
  bookingId,
  date,
  start,
}: {
  bookingId: string;
  date: string;
  start: string;
}) {
  return (
    <form action={confirmRescheduleAction} className="mt-6">
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="start" value={start} />
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
      {pending ? "送信中…" : "この日程に変更する"}
    </button>
  );
}
