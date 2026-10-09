"use client";

import { useState, useActionState } from "react";
import { TEMPLATE_VARIABLES, SAMPLE_VALUES, renderTemplate } from "@/lib/message-template";
import { formatJapaneseDate, addDaysToDateString } from "@/lib/date";
import { saveMessageTemplateAction } from "./actions";
import { INITIAL_SAVE_STATE } from "@/lib/save-state";
import SaveStatus from "@/components/SaveStatus";

export type ReminderSchedule = {
  daysBefore: number;
  minLeadDays: number;
};

export default function MessageEditor({
  templateKey,
  initialBody,
  initialEnabled,
  enabledLabel,
  schedule,
  zoomUrl,
}: {
  templateKey: string;
  initialBody: string;
  initialEnabled: boolean;
  enabledLabel: string;
  schedule?: ReminderSchedule;
  zoomUrl?: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [daysBefore, setDaysBefore] = useState(schedule?.daysBefore ?? 2);
  const [minLeadDays, setMinLeadDays] = useState(schedule?.minLeadDays ?? 5);
  const [state, formAction, pending] = useActionState(saveMessageTemplateAction, INITIAL_SAVE_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="key" value={templateKey} />

      <label className="flex items-center gap-2 text-sm text-sand-700">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={initialEnabled}
          className="h-4 w-4 accent-sage-600"
        />
        {enabledLabel}
      </label>

      {schedule && (
        <div className="rounded-lg bg-sand-50 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-sand-700">
            相談日の
            <input
              type="number"
              name="send_days_before"
              min={1}
              max={365}
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
              className="w-16 rounded-md border border-sand-300 px-2 py-1.5 text-right font-bold focus:border-sage-500 focus:outline-none"
            />
            日前に送る
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-sand-700">
            予約した日から相談日まで
            <input
              type="number"
              name="min_lead_days"
              min={1}
              max={365}
              value={minLeadDays}
              onChange={(e) => setMinLeadDays(Number(e.target.value))}
              className="w-16 rounded-md border border-sand-300 px-2 py-1.5 text-right font-bold focus:border-sage-500 focus:outline-none"
            />
            日以上あいている方にだけ送る
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-sand-400">
            直前に申し込まれた方はまだ記憶に新しいため、リマインドを送らない設定にできます。
          </p>
          <ScheduleExamples daysBefore={daysBefore} minLeadDays={minLeadDays} />
        </div>
      )}

      <div>
        <label htmlFor={`body-${templateKey}`} className="mb-1.5 block text-sm font-bold text-sand-800">
          メッセージ本文
        </label>
        <textarea
          id={`body-${templateKey}`}
          name="body"
          rows={11}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-md border border-sand-300 px-3 py-2 text-sm leading-relaxed focus:border-sage-500 focus:outline-none"
        />
      </div>

      <div className="rounded-lg border border-sand-200 bg-sand-50 p-3">
        <p className="mb-2 text-xs font-bold text-sand-700">使える差し込み項目</p>
        <ul className="space-y-1">
          {TEMPLATE_VARIABLES.map((v) => (
            <li key={v.token} className="flex gap-2 text-xs text-sand-600">
              <code className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-sage-700">
                {v.token}
              </code>
              <span className="text-sand-500">{v.description}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-sand-400">
          本文に書いておくと、送信時に実際の予約内容に置き換わります。
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-bold text-sand-800">送信イメージ</p>
        <div className="rounded-lg bg-sage-50 p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-sand-800">
            {renderTemplate(body, { ...SAMPLE_VALUES, zoomUrl })}
          </p>
        </div>
        <p className="mt-1.5 text-xs text-sand-400">
          サンプル（{SAMPLE_VALUES.name}様 / {formatJapaneseDate(SAMPLE_VALUES.date)}{" "}
          {SAMPLE_VALUES.startTime}〜）で置き換えた表示です。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700 disabled:opacity-60"
        >
          保存する
        </button>
        <SaveStatus state={state} pending={pending} />
      </div>
    </form>
  );
}

/** 設定した数字だと誰に届くのかを具体例で示す */
function ScheduleExamples({
  daysBefore,
  minLeadDays,
}: {
  daysBefore: number;
  minLeadDays: number;
}) {
  if (!Number.isFinite(daysBefore) || !Number.isFinite(minLeadDays)) return null;
  if (daysBefore < 1 || minLeadDays < 1) return null;

  const bookingDate = SAMPLE_VALUES.date;
  const sendDate = addDaysToDateString(bookingDate, -daysBefore);
  const sentCase = addDaysToDateString(bookingDate, -minLeadDays);
  const skippedCase = addDaysToDateString(bookingDate, -(minLeadDays - 1));

  return (
    <div className="mt-3 border-t border-sand-200 pt-2.5">
      <p className="mb-1.5 text-xs font-bold text-sand-600">この設定だと、こうなります</p>
      <p className="mb-1 text-xs leading-relaxed text-sand-600">
        <span className="mr-1.5 font-bold text-sage-700">送る</span>
        {formatJapaneseDate(sentCase)}に申し込み → {formatJapaneseDate(bookingDate)}の相談。
        {formatJapaneseDate(sendDate)}にリマインドが届きます。
      </p>
      <p className="text-xs leading-relaxed text-sand-400">
        <span className="mr-1.5 font-bold">送らない</span>
        {formatJapaneseDate(skippedCase)}に申し込み → {formatJapaneseDate(bookingDate)}の相談。
        {minLeadDays}日未満なので送りません。
      </p>
    </div>
  );
}
