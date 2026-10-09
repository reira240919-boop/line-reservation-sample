"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "./actions";
import { INITIAL_SAVE_STATE } from "@/lib/save-state";
import SaveStatus from "@/components/SaveStatus";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, INITIAL_SAVE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="current_password" className="mb-1.5 block text-sm font-bold text-sand-800">
          現在のパスワード
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="new_password" className="mb-1.5 block text-sm font-bold text-sand-800">
          新しいパスワード（8文字以上）
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="confirm_password" className="mb-1.5 block text-sm font-bold text-sand-800">
          新しいパスワード（確認）
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700 disabled:opacity-60"
        >
          変更する
        </button>
        <SaveStatus state={state} pending={pending} />
      </div>
    </form>
  );
}
