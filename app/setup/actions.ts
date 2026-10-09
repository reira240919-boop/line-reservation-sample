"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSession } from "@/lib/auth";

export async function setupAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/setup?error=short");
  }
  if (password !== confirm) {
    redirect("/setup?error=mismatch");
  }

  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("therapists")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    redirect("/login");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from("therapists").insert({ password_hash: passwordHash });

  if (error) {
    redirect("/setup?error=unknown");
  }

  await createSession();
  redirect("/dashboard");
}
