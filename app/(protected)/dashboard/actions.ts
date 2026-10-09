"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import { sendTemplatedMessage } from "@/lib/send-templated-message";
import { TEMPLATE_KEYS } from "@/lib/message-template";
import type { SaveState } from "@/lib/save-state";

export async function cancelBookingAction(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase
    .from("bookings")
    .select("date, start_time, end_time, client_name, concerns, line_user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString(), changed_by: "therapist" })
    .eq("id", id);

  if (!error && booking) {
    await sendTemplatedMessage({
      templateKey: TEMPLATE_KEYS.cancelledByTherapist,
      to: booking.line_user_id,
      values: {
        name: booking.client_name,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        concerns: booking.concerns ?? [],
      },
    });
  }

  revalidatePath("/dashboard");
}

export async function toggleContractedAction(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("bookings").select("contracted").eq("id", id).maybeSingle();
  await supabase
    .from("bookings")
    .update({ contracted: !data?.contracted })
    .eq("id", id);

  revalidatePath("/dashboard");
}

export async function saveMemoAction(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { status: "error", message: "保存できませんでした" };
  }
  const memo = String(formData.get("memo") ?? "").trim();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ memo: memo || null })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "保存できませんでした" };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "保存しました" };
}
