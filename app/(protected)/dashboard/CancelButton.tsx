"use client";

import { cancelBookingAction } from "./actions";

export default function CancelButton({ id }: { id: string }) {
  return (
    <form
      action={cancelBookingAction}
      onSubmit={(e) => {
        if (!confirm("この予約をキャンセルしますか？")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="shrink-0 rounded-md px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
      >
        キャンセル
      </button>
    </form>
  );
}
