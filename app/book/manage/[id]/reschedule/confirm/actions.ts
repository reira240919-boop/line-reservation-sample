"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getOwnedBooking } from "@/lib/booking-ownership";
import { isWithinClientManageWindow } from "@/lib/manage-window";
import { getSlotStatus } from "@/lib/slot-availability";
import { timeToMinutes, minutesToTime } from "@/lib/schedule";
import { sendTemplatedMessage } from "@/lib/send-templated-message";
import { TEMPLATE_KEYS } from "@/lib/message-template";
import { notifyTherapistOfClientReschedule } from "@/lib/notify";

export async function confirmRescheduleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) {
    redirect(`/book/manage/${id}/reschedule`);
  }

  const booking = await getOwnedBooking(id);
  if (
    !booking ||
    booking.status !== "confirmed" ||
    booking.client_reschedule_used ||
    !isWithinClientManageWindow(booking.date)
  ) {
    redirect(`/book/manage/${id}`);
  }
  if (!isWithinClientManageWindow(date)) {
    redirect(`/book/manage/${id}/reschedule?week=0&error=window`);
  }

  const status = await getSlotStatus(date, start, id);
  if (status !== "available") {
    redirect(`/book/manage/${id}/reschedule/confirm?date=${date}&start=${start}&error=taken`);
  }

  const end = minutesToTime(timeToMinutes(start) + 60);
  const oldDate = booking.date;
  const oldStartTime = booking.start_time;
  const oldEndTime = booking.end_time;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({
      date,
      start_time: start,
      end_time: end,
      updated_at: new Date().toISOString(),
      changed_by: "client",
      client_reschedule_used: true,
    })
    .eq("id", id);

  if (error) {
    redirect(`/book/manage/${id}/reschedule/confirm?date=${date}&start=${start}&error=taken`);
  }

  await Promise.all([
    sendTemplatedMessage({
      templateKey: TEMPLATE_KEYS.rescheduled,
      to: booking.line_user_id,
      values: {
        name: booking.client_name,
        date,
        startTime: start,
        endTime: end,
        concerns: booking.concerns,
        oldDate,
        oldStartTime,
        oldEndTime,
      },
    }),
    notifyTherapistOfClientReschedule({
      clientName: booking.client_name,
      oldDate,
      oldStartTime,
      oldEndTime,
      newDate: date,
      newStartTime: start,
      newEndTime: end,
    }),
  ]);

  redirect(`/book/manage/${id}?done=rescheduled`);
}
