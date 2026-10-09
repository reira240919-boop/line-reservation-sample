import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * サーバー側専用の Supabase クライアント（Secret key を使用）。
 * RLSをバイパスするため、管理画面のサーバーコンポーネント/サーバーアクションからのみ呼び出すこと。
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が .env.local に設定されていません",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}
