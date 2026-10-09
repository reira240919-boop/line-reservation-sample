import { todayJST, addDaysToDateString } from "./date";

/** お客様がご自身で変更・キャンセルできる期限（相談日の何日前まで） */
export const CLIENT_MANAGE_MIN_DAYS = 3;

/** 今日から見て、その予約日がまだお客様側で変更・キャンセルできる期間内かどうか */
export function isWithinClientManageWindow(bookingDate: string): boolean {
  const today = todayJST();
  return bookingDate >= addDaysToDateString(today, CLIENT_MANAGE_MIN_DAYS);
}
