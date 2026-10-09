"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("therapists")
    .select("password_hash")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    redirect("/setup");
  }

  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) {
    redirect("/login?error=1");
  }

  await createSession();
  redirect("/dashboard");
}
