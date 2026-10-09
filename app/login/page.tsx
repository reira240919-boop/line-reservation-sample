import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("therapists")
    .select("*", { count: "exact", head: true });

  if (!count) {
    redirect("/setup");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-sand-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-bold text-sand-900">管理画面ログイン</h1>
        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            パスワードが違います
          </p>
        )}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-sand-700">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-sand-300 px-3 py-2 focus:border-sage-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}
