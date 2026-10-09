"use client";

import type { SaveState } from "@/lib/save-state";

/** 保存ボタンの横に「保存しました」などを表示する */
export default function SaveStatus({
  state,
  pending,
}: {
  state: SaveState;
  pending: boolean;
}) {
  if (pending) {
    return <span className="text-sm text-sand-500">保存中…</span>;
  }
  if (state.status === "success") {
    return (
      <span className="flex items-center gap-1 text-sm font-medium text-sage-700">
        <span aria-hidden>✓</span>
        {state.message}
      </span>
    );
  }
  if (state.status === "error") {
    return <span className="text-sm font-medium text-red-600">{state.message}</span>;
  }
  return null;
}
