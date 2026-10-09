import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { setupAction } from "./actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  short: "パスワードは8文字以上にしてください",
  mismatch: "パスワードが一致しません",
  unknown: "登録に失敗しました。もう一度お試しください",
};

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("therapists")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    redirect("/login");
  }

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4">
      <form
        action={setupAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-sand-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold text-sand-900">初回セットアップ</h1>
          <p className="mt-1 text-sm text-sand-500">
            管理画面用のパスワードを設定してください
          </p>
        </div>
        {errorMessage && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
        )}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-sand-700">
            パスワード（8文字以上）
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-sand-700">
            パスワード（確認）
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700"
        >
          設定する
        </button>
      </form>
    </main>
  );
}
