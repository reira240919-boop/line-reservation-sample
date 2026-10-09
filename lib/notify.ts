import "server-only";
import { getSupabaseAdmin } from "./supabase-admin";
import { pushMessage } from "./line";
import { formatJapaneseDate } from "./date";

type BookingForNotice = {
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  concerns: string[] | null;
  comment: string | null;
};

/**
 * 予約が入ったことを管理者のLINEへ通知する。
 * 通知に失敗しても予約自体は成立させたいので、例外は投げずに結果だけ返す。
 */
export async function notifyTherapistOfBooking(booking: BookingForNotice): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: therapist } = await supabase
      .from("therapists")
      .select("notify_line_user_id")
      .limit(1)
      .maybeSingle();

    const to = therapist?.notify_line_user_id;
    if (!to) return false;

    const concerns = (booking.concerns ?? []).join("・");
    const lines = [
      "🌿 新しい予約が入りました",
      "",
      `${formatJapaneseDate(booking.date)} ${booking.start_time.slice(0, 5)}〜${booking.end_time.slice(0, 5)}`,
      `お名前：${booking.client_name}`,
      concerns ? `ご相談：${concerns}` : null,
      booking.comment ? `コメント：${booking.comment}` : null,
    ].filter((line): line is string => line !== null);

    return await pushMessage(to, lines.join("\n"));
  } catch (err) {
    console.error("管理者への通知に失敗しました:", err);
    return false;
  }
}

async function getNotifyTarget(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("therapists")
    .select("notify_line_user_id")
    .limit(1)
    .maybeSingle();
  return data?.notify_line_user_id ?? null;
}

/** お客様自身がキャンセルしたことを管理者へ通知する */
export async function notifyTherapistOfClientCancellation(booking: BookingForNotice): Promise<boolean> {
  try {
    const to = await getNotifyTarget();
    if (!to) return false;

    const text = [
      "🔔 お客様都合でキャンセルされました",
      "",
      `${formatJapaneseDate(booking.date)} ${booking.start_time.slice(0, 5)}〜${booking.end_time.slice(0, 5)}`,
      `お名前：${booking.client_name}`,
    ].join("\n");

    return await pushMessage(to, text);
  } catch (err) {
    console.error("キャンセル通知に失敗しました:", err);
    return false;
  }
}

/** お客様自身が日程を変更したことを管理者へ通知する */
export async function notifyTherapistOfClientReschedule({
  clientName,
  oldDate,
  oldStartTime,
  oldEndTime,
  newDate,
  newStartTime,
  newEndTime,
}: {
  clientName: string;
  oldDate: string;
  oldStartTime: string;
  oldEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}): Promise<boolean> {
  try {
    const to = await getNotifyTarget();
    if (!to) return false;

    const text = [
      "🔄 お客様が日程を変更しました",
      "",
      `お名前：${clientName}`,
      `変更前：${formatJapaneseDate(oldDate)} ${oldStartTime.slice(0, 5)}〜${oldEndTime.slice(0, 5)}`,
      `変更後：${formatJapaneseDate(newDate)} ${newStartTime.slice(0, 5)}〜${newEndTime.slice(0, 5)}`,
    ].join("\n");

    return await pushMessage(to, text);
  } catch (err) {
    console.error("変更通知に失敗しました:", err);
    return false;
  }
}
