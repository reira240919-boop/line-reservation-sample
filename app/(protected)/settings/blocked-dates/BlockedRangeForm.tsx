"use client";

import { useActionState } from "react";
import { addBlockedRangeAction } from "./actions";
import { INITIAL_SAVE_STATE } from "@/lib/save-state";
import SaveStatus from "@/components/SaveStatus";

export default function BlockedRangeForm() {
  const [state, formAction, pending] = useActionState(addBlockedRangeAction, INITIAL_SAVE_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="start_date" className="mb-1 block text-sm text-sand-600">
          開始日
        </label>
        <input
          id="start_date"
          name="start_date"
          type="date"
          required
          className="rounded-md border border-sand-300 px-2 py-1.5 focus:border-sage-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="end_date" className="mb-1 block text-sm text-sand-600">
          終了日（省略で開始日のみ）
        </label>
        <input
          id="end_date"
          name="end_date"
          type="date"
          className="rounded-md border border-sand-300 px-2 py-1.5 focus:border-sage-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sage-600 px-4 py-1.5 font-medium text-white hover:bg-sage-700 disabled:opacity-60"
      >
        登録
      </button>
      <SaveStatus state={state} pending={pending} />
    </form>
  );
}
