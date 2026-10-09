import { formatJapaneseDate, addDaysToDateString } from "./date";

export const TEMPLATE_KEYS = {
  confirmed: "booking_confirmed",
  reminder: "booking_reminder",
  zoomLink: "booking_zoom_link",
  rescheduled: "booking_rescheduled",
  cancelledByClient: "booking_cancelled_by_client",
  cancelledByTherapist: "booking_cancelled_by_therapist",
} as const;

/** 差し込み項目のプレビューに使うサンプル予約 */
export const SAMPLE_VALUES: TemplateValues = {
  name: "山田 花子",
  date: "2026-09-10",
  startTime: "14:00",
  endTime: "15:00",
  concerns: ["仕事", "お金"],
  oldDate: "2026-09-05",
  oldStartTime: "10:00",
  oldEndTime: "11:00",
  manageUrl: "https://liff.line.me/xxxxxxxxxx/manage/xxxxxxxx",
};

/**
 * リマインドを送る対象かどうかを判定する。
 * 予約した日から相談日までが minLeadDays 未満の場合は、直前の申し込みとみなして送らない。
 */
export function shouldSendReminder({
  bookingDate,
  createdDate,
  minLeadDays,
}: {
  bookingDate: string;
  createdDate: string;
  minLeadDays: number;
}): boolean {
  return createdDate <= addDaysToDateString(bookingDate, -minLeadDays);
}

/** メッセージ文面で使える差し込み項目 */
export const TEMPLATE_VARIABLES = [
  { token: "{お名前}", description: "お客様のお名前" },
  { token: "{日付}", description: "予約日（例: 9月2日（水））" },
  { token: "{開始時間}", description: "開始時刻（例: 14:00）" },
  { token: "{終了時間}", description: "終了時刻（例: 15:00）" },
  { token: "{相談内容}", description: "選択された悩み（例: 仕事・お金）" },
  { token: "{ZoomのURL}", description: "設定したZoomのURL" },
  { token: "{変更前日付}", description: "（日程変更用）変更前の予約日" },
  { token: "{変更前開始時間}", description: "（日程変更用）変更前の開始時刻" },
  { token: "{変更前終了時間}", description: "（日程変更用）変更前の終了時刻" },
  { token: "{管理用URL}", description: "お客様がご自身で変更・キャンセルできるページのURL" },
] as const;

export type TemplateValues = {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  concerns: string[];
  zoomUrl?: string;
  oldDate?: string;
  oldStartTime?: string;
  oldEndTime?: string;
  manageUrl?: string;
};

/** 文面の差し込み項目を実際の値に置き換える */
export function renderTemplate(body: string, values: TemplateValues): string {
  return body
    .replaceAll("{お名前}", values.name)
    .replaceAll("{日付}", formatJapaneseDate(values.date))
    .replaceAll("{開始時間}", values.startTime.slice(0, 5))
    .replaceAll("{終了時間}", values.endTime.slice(0, 5))
    .replaceAll("{相談内容}", values.concerns.join("・"))
    .replaceAll("{ZoomのURL}", values.zoomUrl || "（ZoomのURLが未設定です）")
    .replaceAll("{変更前日付}", values.oldDate ? formatJapaneseDate(values.oldDate) : "")
    .replaceAll("{変更前開始時間}", values.oldStartTime?.slice(0, 5) ?? "")
    .replaceAll("{変更前終了時間}", values.oldEndTime?.slice(0, 5) ?? "")
    .replaceAll("{管理用URL}", values.manageUrl ?? "");
}
