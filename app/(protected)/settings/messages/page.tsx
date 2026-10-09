import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { TEMPLATE_KEYS } from "@/lib/message-template";
import MessageEditor from "./MessageEditor";
import MessageTabs, { type MessageTab } from "./MessageTabs";

export const dynamic = "force-dynamic";

type TemplateRow = {
  key: string;
  body: string;
  enabled: boolean;
  send_days_before: number | null;
  min_lead_days: number | null;
};

export default async function MessagesSettingsPage() {
  const supabase = getSupabaseAdmin();
  const [{ data }, { data: therapist }] = await Promise.all([
    supabase.from("message_templates").select("key, body, enabled, send_days_before, min_lead_days"),
    supabase.from("therapists").select("zoom_url").limit(1).maybeSingle(),
  ]);

  const byKey = new Map((data ?? []).map((row) => [row.key, row as TemplateRow]));
  const confirmed = byKey.get(TEMPLATE_KEYS.confirmed);
  const reminder = byKey.get(TEMPLATE_KEYS.reminder);
  const zoomLink = byKey.get(TEMPLATE_KEYS.zoomLink);
  const rescheduled = byKey.get(TEMPLATE_KEYS.rescheduled);
  const cancelledByClient = byKey.get(TEMPLATE_KEYS.cancelledByClient);
  const cancelledByTherapist = byKey.get(TEMPLATE_KEYS.cancelledByTherapist);
  const zoomUrl = therapist?.zoom_url ?? undefined;

  const tabs: MessageTab[] = [
    {
      key: "confirmed",
      label: "予約完了",
      badge: "予約直後に送信",
      content: (
        <MessageEditor
          templateKey={TEMPLATE_KEYS.confirmed}
          initialBody={confirmed?.body ?? ""}
          initialEnabled={confirmed?.enabled ?? true}
          enabledLabel="予約が確定したら自動で送信する"
          zoomUrl={zoomUrl}
        />
      ),
    },
    {
      key: "reminder",
      label: "リマインド",
      badge: "相談日の前に送信",
      content: (
        <MessageEditor
          templateKey={TEMPLATE_KEYS.reminder}
          initialBody={reminder?.body ?? ""}
          initialEnabled={reminder?.enabled ?? true}
          enabledLabel="リマインドを自動で送信する"
          schedule={{
            daysBefore: reminder?.send_days_before ?? 2,
            minLeadDays: reminder?.min_lead_days ?? 5,
          }}
          zoomUrl={zoomUrl}
        />
      ),
    },
    {
      key: "zoomLink",
      label: "当日案内",
      badge: "毎朝9時に一括送信",
      content: (
        <>
          <p className="mb-4 text-xs leading-relaxed text-sand-500">
            毎朝9時に、その日ご相談があるお客様全員へまとめて送信されます。時間帯を個別に狙って送ることはできません。
          </p>
          <MessageEditor
            templateKey={TEMPLATE_KEYS.zoomLink}
            initialBody={zoomLink?.body ?? ""}
            initialEnabled={zoomLink?.enabled ?? true}
            enabledLabel="毎朝9時にZoomのURLを自動で送信する"
            zoomUrl={zoomUrl}
          />
        </>
      ),
    },
    {
      key: "rescheduled",
      label: "日程変更",
      badge: "お客様が変更した直後に送信",
      content: (
        <MessageEditor
          templateKey={TEMPLATE_KEYS.rescheduled}
          initialBody={rescheduled?.body ?? ""}
          initialEnabled={rescheduled?.enabled ?? true}
          enabledLabel="日程変更時に自動で送信する"
          zoomUrl={zoomUrl}
        />
      ),
    },
    {
      key: "cancelledByClient",
      label: "キャンセル（お客様）",
      badge: "お客様がキャンセルした直後に送信",
      content: (
        <MessageEditor
          templateKey={TEMPLATE_KEYS.cancelledByClient}
          initialBody={cancelledByClient?.body ?? ""}
          initialEnabled={cancelledByClient?.enabled ?? true}
          enabledLabel="キャンセル時に自動で送信する"
          zoomUrl={zoomUrl}
        />
      ),
    },
    {
      key: "cancelledByTherapist",
      label: "キャンセル（管理側）",
      badge: "予約一覧でキャンセルした直後に送信",
      content: (
        <MessageEditor
          templateKey={TEMPLATE_KEYS.cancelledByTherapist}
          initialBody={cancelledByTherapist?.body ?? ""}
          initialEnabled={cancelledByTherapist?.enabled ?? true}
          enabledLabel="管理側でキャンセルした時に自動で送信する"
          zoomUrl={zoomUrl}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sand-900">メッセージ設定</h1>
      <p className="mt-1 text-sm text-sand-500">
        お客様のLINEへ自動で送るメッセージを設定します。
      </p>

      <p className="mt-4 rounded-lg bg-sand-100 px-3 py-2 text-xs text-sand-600">
        ※ 実際の送信はLINE連携の設定後に有効になります。今は文面の準備のみ行えます。
      </p>

      <MessageTabs tabs={tabs} />
    </div>
  );
}
