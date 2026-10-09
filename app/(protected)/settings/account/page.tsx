import { getSupabaseAdmin } from "@/lib/supabase-admin";
import PasswordForm from "./PasswordForm";
import ZoomUrlForm from "./ZoomUrlForm";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const supabase = getSupabaseAdmin();
  const { data: therapist } = await supabase.from("therapists").select("zoom_url").limit(1).maybeSingle();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sand-900">アカウント設定</h1>
      <p className="mt-1 text-sm text-sand-500">ログインや基本情報の設定を行います。</p>

      <section className="mt-6 rounded-lg border border-sand-200 bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-sand-900">パスワード変更</h2>
        <PasswordForm />
      </section>

      <section className="mt-6 rounded-lg border border-sand-200 bg-white p-5">
        <h2 className="mb-1 text-base font-bold text-sand-900">ZoomのURL</h2>
        <p className="mb-3 text-xs text-sand-500">
          当日のご案内に差し込まれます。毎回同じURLを使う設定です。
        </p>
        <ZoomUrlForm initialUrl={therapist?.zoom_url ?? ""} />
        <p className="mt-2 text-xs text-sand-400">
          同じURLを使い回すため、Zoom側で「待機室」をオンにしておくことをおすすめします。
        </p>
      </section>
    </div>
  );
}
