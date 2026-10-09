"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getOwnedBooking } from "@/lib/booking-ownership";
import { isWithinClientManageWindow } from "@/lib/manage-window";
import { sendTemplatedMessage } from "@/lib/send-templated-message";
import { TEMPLATE_KEYS } from "@/lib/message-template";
import { notifyTherapistOfClientCancellation } from "@/lib/notify";

export async function cancelBookingByClientAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const booking = await getOwnedBooking(id);

  if (!booking || booking.status !== "confirmed" || !isWithinClientManageWindow(booking.date)) {
    redirect(`/book/manage/${id}`);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString(), changed_by: "client" })
    .eq("id", id);

  if (error) {
    redirect(`/book/manage/${id}`);
  }

  await Promise.all([
    sendTemplatedMessage({
      templateKey: TEMPLATE_KEYS.cancelledByClient,
      to: booking.line_user_id,
      values: {
        name: booking.client_name,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        concerns: booking.concerns,
      },
    }),
    notifyTherapistOfClientCancellation({
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      client_name: booking.client_name,
      concerns: booking.concerns,
      comment: null,
    }),
  ]);

  revalidatePath(`/book/manage/${id}`);
  redirect(`/book/manage/${id}?done=cancelled`);
}
