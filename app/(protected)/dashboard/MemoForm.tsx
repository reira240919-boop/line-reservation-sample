"use client";

import { useActionState } from "react";
import { saveMemoAction } from "./actions";
import { INITIAL_SAVE_STATE } from "@/lib/save-state";
import SaveStatus from "@/components/SaveStatus";

export default function MemoForm({ bookingId, initialMemo }: { bookingId: string; initialMemo: string }) {
  const [state, formAction, pending] = useActionState(saveMemoAction, INITIAL_SAVE_STATE);

  return (
    <form action={formAction} className="ml-[38px] mt-2">
      <input type="hidden" name="id" value={bookingId} />
      <div className="flex items-center gap-2">
        <textarea
          name="memo"
          rows={1}
          defaultValue={initialMemo}
          placeholder="メモを書く"
          className="h-8 w-full resize-y rounded-md border border-sand-200 bg-sand-50 px-2.5 py-1.5 text-xs leading-[1.1] text-sand-700 focus:border-sage-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-8 shrink-0 rounded-md border border-sand-200 px-2.5 text-xs font-medium text-sand-500 hover:bg-sand-50 disabled:opacity-60"
        >
          保存
        </button>
      </div>
      <div className="mt-1">
        <SaveStatus state={state} pending={pending} />
      </div>
    </form>
  );
}
