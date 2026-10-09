import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendTemplatedMessage } from "@/lib/send-templated-message";
import { TEMPLATE_KEYS, shouldSendReminder } from "@/lib/message-template";
import { todayJST, addDaysToDateString } from "@/lib/date";

const TIME_ZONE = "Asia/Tokyo";

function toJSTDateString(isoString: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(new Date(isoString));
}

/**
 * リマインド（相談日の◯日前）と当日のZoom案内を、まだ送っていない予約があれば自動送信する。
 * Vercel Cron から毎朝9時（JST）に1回呼び出される（無料プランは1日1回までのため）。
 * Zoom案内は「開始◯時間前」の狙い撃ちはできないため、当日分をこの時刻にまとめて送る。
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let reminderCount = 0;
  let zoomLinkCount = 0;

  // --- リマインド（相談日の◯日前） ---
  const { data: reminderTemplate } = await supabase
    .from("message_templates")
    .select("enabled, send_days_before, min_lead_days")
    .eq("key", TEMPLATE_KEYS.reminder)
    .maybeSingle();

  if (reminderTemplate?.enabled && reminderTemplate.send_days_before) {
    const targetDate = addDaysToDateString(todayJST(), reminderTemplate.send_days_before);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, date, start_time, end_time, client_name, concerns, line_user_id, created_at")
      .eq("date", targetDate)
      .eq("status", "confirmed")
      .is("reminder_sent_at", null);

    for (const b of bookings ?? []) {
      const eligible = shouldSendReminder({
        bookingDate: b.date,
        createdDate: toJSTDateString(b.created_at),
        minLeadDays: reminderTemplate.min_lead_days ?? 0,
      });

      if (eligible && b.line_user_id) {
        await sendTemplatedMessage({
          templateKey: TEMPLATE_KEYS.reminder,
          to: b.line_user_id,
          values: {
            name: b.client_name,
            date: b.date,
            startTime: b.start_time,
            endTime: b.end_time,
            concerns: b.concerns ?? [],
          },
        });
      }

      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", b.id);
      reminderCount++;
    }
  }

  // --- 当日のZoom案内（毎朝9時に、その日の予約がある方へ一括送信） ---
  const [{ data: zoomTemplate }, { data: therapist }] = await Promise.all([
    supabase
      .from("message_templates")
      .select("enabled")
      .eq("key", TEMPLATE_KEYS.zoomLink)
      .maybeSingle(),
    supabase.from("therapists").select("zoom_url").limit(1).maybeSingle(),
  ]);

  if (zoomTemplate?.enabled) {
    const today = todayJST();
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, date, start_time, end_time, client_name, concerns, line_user_id")
      .eq("date", today)
      .eq("status", "confirmed")
      .is("zoom_link_sent_at", null);

    for (const b of bookings ?? []) {
      if (b.line_user_id) {
        await sendTemplatedMessage({
          templateKey: TEMPLATE_KEYS.zoomLink,
          to: b.line_user_id,
          values: {
            name: b.client_name,
            date: b.date,
            startTime: b.start_time,
            endTime: b.end_time,
            concerns: b.concerns ?? [],
            zoomUrl: therapist?.zoom_url ?? undefined,
          },
        });
      }

      await supabase
        .from("bookings")
        .update({ zoom_link_sent_at: new Date().toISOString() })
        .eq("id", b.id);
      zoomLinkCount++;
    }
  }

  return NextResponse.json({ ok: true, reminderCount, zoomLinkCount });
}
