"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import { addDaysToDateString } from "@/lib/date";
import type { SaveState } from "@/lib/save-state";

const MAX_RANGE_DAYS = 366;

export async function toggleBlockedDate(date: string) {
  await requireAuth();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("blocked_dates")
    .select("id")
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    await supabase.from("blocked_dates").delete().eq("date", date);
  } else {
    await supabase.from("blocked_dates").insert({ date });
  }

  revalidatePath("/settings/blocked-dates");
  revalidatePath("/preview/booking-calendar");
}

export async function toggleTimeSlotOverride(date: string, startTime: string) {
  await requireAuth();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime)) return;

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("time_overrides")
    .select("id")
    .eq("date", date)
    .eq("start_time", startTime)
    .maybeSingle();

  if (existing) {
    await supabase.from("time_overrides").delete().eq("id", existing.id);
  } else {
    await supabase.from("time_overrides").insert({ date, start_time: startTime });
  }

  revalidatePath("/settings/blocked-dates");
  revalidatePath("/preview/booking-calendar");
}

export async function addBlockedRangeAction(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAuth();

  const start = String(formData.get("start_date") ?? "").trim();
  const endInput = String(formData.get("end_date") ?? "").trim();
  const end = endInput || start;
  if (!start) {
    return { status: "error", message: "開始日を入力してください" };
  }
  if (start > end) {
    return { status: "error", message: "終了日は開始日より後にしてください" };
  }

  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end && dates.length < MAX_RANGE_DAYS) {
    dates.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blocked_dates")
    .upsert(
      dates.map((date) => ({ date })),
      { onConflict: "date" },
    );

  if (error) {
    return { status: "error", message: "登録できませんでした" };
  }

  revalidatePath("/settings/blocked-dates");
  revalidatePath("/preview/booking-calendar");
  return { status: "success", message: "登録しました" };
}
