"use client";

import { useFormStatus } from "react-dom";
import { cancelBookingByClientAction } from "./actions";

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  return (
    <form
      action={cancelBookingByClientAction}
      onSubmit={(e) => {
        if (!confirm("このご予約をキャンセルしますか？")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={bookingId} />
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
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "処理中…" : "キャンセルする"}
    </button>
  );
}
