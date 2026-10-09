"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import type { SaveState } from "@/lib/save-state";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export async function saveAvailabilityAction(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAuth();
  const supabase = getSupabaseAdmin();

  const bookingWindowDays = Number(formData.get("booking_window_days"));
  if (Number.isFinite(bookingWindowDays) && bookingWindowDays > 0) {
    await supabase
      .from("therapists")
      .update({ booking_window_days: Math.floor(bookingWindowDays) })
      .not("id", "is", null);
  }

  const minLeadMinutes = Number(formData.get("min_booking_lead_minutes"));
  if (Number.isFinite(minLeadMinutes) && minLeadMinutes >= 0) {
    await supabase
      .from("therapists")
      .update({ min_booking_lead_minutes: Math.floor(minLeadMinutes) })
      .not("id", "is", null);
  }

  for (const day of DAYS) {
    const start = String(formData.get(`start_${day}`) ?? "").trim();
    const end = String(formData.get(`end_${day}`) ?? "").trim();

    if (!start || !end) {
      await supabase.from("availability").delete().eq("day_of_week", day);
      continue;
    }

    await supabase
      .from("availability")
      .upsert(
        { day_of_week: day, start_time: start, end_time: end },
        { onConflict: "day_of_week" },
      );
  }

  revalidatePath("/settings/availability");
  return { status: "success", message: "保存しました" };
}
