"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSlotStatus } from "@/lib/slot-availability";
import { notifyTherapistOfBooking } from "@/lib/notify";
import { sendTemplatedMessage } from "@/lib/send-templated-message";
import { TEMPLATE_KEYS } from "@/lib/message-template";
import { timeToMinutes, minutesToTime } from "@/lib/schedule";
import { buildManageUrl } from "@/lib/manage-url";

export async function createBookingAction(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const concerns = formData.getAll("concerns").map(String);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) {
    redirect("/book");
  }
  if (!name) {
    redirect(`/book/details?date=${date}&start=${start}&error=name`);
  }
  if (concerns.length === 0) {
    redirect(`/book/details?date=${date}&start=${start}&error=concerns`);
  }

  const status = await getSlotStatus(date, start);
  if (status !== "available") {
    redirect(`/book/details?date=${date}&start=${start}&error=taken`);
  }

  const end = minutesToTime(timeToMinutes(start) + 60);
  const lineUserId = (await cookies()).get("line_uid")?.value || null;

  const supabase = getSupabaseAdmin();
  const { data: therapist } = await supabase
    .from("therapists")
    .select("zoom_url")
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      date,
      start_time: start,
      end_time: end,
      client_name: name,
      concerns,
      comment: comment || null,
      status: "confirmed",
      line_user_id: lineUserId,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/book/details?date=${date}&start=${start}&error=taken`);
  }

  // 通知・確認メッセージが失敗しても予約は成立させる
  await Promise.all([
    notifyTherapistOfBooking({
      date,
      start_time: start,
      end_time: end,
      client_name: name,
      concerns,
      comment: comment || null,
    }),
    sendTemplatedMessage({
      templateKey: TEMPLATE_KEYS.confirmed,
      to: lineUserId,
      values: {
        name,
        date,
        startTime: start,
        endTime: end,
        concerns,
        zoomUrl: therapist?.zoom_url ?? undefined,
        manageUrl: buildManageUrl(data.id),
      },
    }),
  ]);

  redirect(`/book/complete?id=${data.id}`);
}
