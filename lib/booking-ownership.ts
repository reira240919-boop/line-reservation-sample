import "server-only";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "./supabase-admin";

export type OwnedBooking = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  concerns: string[];
  status: "confirmed" | "cancelled";
  line_user_id: string | null;
  client_reschedule_used: boolean;
};

/**
 * 予約IDから予約を取得し、本人（同じLINEユーザー）かどうかを確認する。
 * 予約にLINE IDが記録されていない古い予約は、本人確認なしで表示を許可する
 * （LIFF対応前に作られた予約を締め出さないための救済措置）。
 */
export async function getOwnedBooking(bookingId: string): Promise<OwnedBooking | null> {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return null;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, date, start_time, end_time, client_name, concerns, status, line_user_id, client_reschedule_used",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!data) return null;

  if (data.line_user_id) {
    const cookieUid = (await cookies()).get("line_uid")?.value;
    if (cookieUid !== data.line_user_id) return null;
  }

  return data as OwnedBooking;
}
