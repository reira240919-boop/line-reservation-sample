"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";

import type { SaveState } from "@/lib/save-state";

/** 1〜365 の整数に収める（不正な入力は既定値にフォールバック） */
function toPositiveInt(value: FormDataEntryValue | null, fallback: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1 || n > 365) return fallback;
  return n;
}

export async function saveMessageTemplateAction(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAuth();

  const key = String(formData.get("key") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!key) {
    return { status: "error", message: "保存できませんでした" };
  }
  if (!body) {
    return { status: "error", message: "本文を入力してください" };
  }

  const record: {
    key: string;
    body: string;
    enabled: boolean;
    updated_at: string;
    send_days_before?: number;
    min_lead_days?: number;
  } = { key, body, enabled, updated_at: new Date().toISOString() };

  // リマインドのみ送信条件を持つ
  if (formData.has("send_days_before")) {
    record.send_days_before = toPositiveInt(formData.get("send_days_before"), 2);
    record.min_lead_days = toPositiveInt(formData.get("min_lead_days"), 5);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("message_templates").upsert(record, { onConflict: "key" });

  if (error) {
    return { status: "error", message: "保存できませんでした" };
  }

  revalidatePath("/settings/messages");
  return { status: "success", message: "保存しました" };
}
