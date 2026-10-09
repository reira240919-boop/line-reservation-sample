"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";
import type { SaveState } from "@/lib/save-state";

export async function changePasswordAction(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAuth();

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 8) {
    return { status: "error", message: "新しいパスワードは8文字以上にしてください" };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "新しいパスワードが一致しません" };
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("therapists").select("id, password_hash").limit(1).maybeSingle();

  if (!data) {
    return { status: "error", message: "アカウント情報が見つかりませんでした" };
  }

  const valid = await bcrypt.compare(currentPassword, data.password_hash);
  if (!valid) {
    return { status: "error", message: "現在のパスワードが違います" };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("therapists")
    .update({ password_hash: newHash })
    .eq("id", data.id);

  if (error) {
    return { status: "error", message: "変更できませんでした" };
  }

  return { status: "success", message: "パスワードを変更しました" };
}

export async function saveZoomUrlAction(
  _prevState: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAuth();

  const zoomUrl = String(formData.get("zoom_url") ?? "").trim();
  if (zoomUrl && !/^https?:\/\//.test(zoomUrl)) {
    return { status: "error", message: "URLの形式が正しくありません" };
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("therapists").select("id").limit(1).maybeSingle();
  if (!data) {
    return { status: "error", message: "保存できませんでした" };
  }

  const { error } = await supabase
    .from("therapists")
    .update({ zoom_url: zoomUrl || null })
    .eq("id", data.id);

  if (error) {
    return { status: "error", message: "保存できませんでした" };
  }

  revalidatePath("/settings/account");
  return { status: "success", message: "保存しました" };
}
