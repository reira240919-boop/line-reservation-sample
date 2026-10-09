"use client";

import { useActionState } from "react";
import { saveZoomUrlAction } from "./actions";
import { INITIAL_SAVE_STATE } from "@/lib/save-state";
import SaveStatus from "@/components/SaveStatus";

export default function ZoomUrlForm({ initialUrl }: { initialUrl: string }) {
  const [state, formAction, pending] = useActionState(saveZoomUrlAction, INITIAL_SAVE_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="url"
        name="zoom_url"
        defaultValue={initialUrl}
        placeholder="https://us06web.zoom.us/j/..."
        className="min-w-0 flex-1 rounded-md border border-sand-300 px-3 py-2 text-sm focus:border-sage-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700 disabled:opacity-60"
      >
        保存
      </button>
      <SaveStatus state={state} pending={pending} />
    </form>
  );
}
