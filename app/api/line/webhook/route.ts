import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignature, fetchProfile } from "@/lib/line";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type LineEvent = {
  type: string;
  source?: { type: string; userId?: string };
};

/** 友だち追加・メッセージ受信のたびに、送り先として使えるユーザーを記録する */
async function rememberUser(userId: string) {
  const profile = await fetchProfile(userId);
  const supabase = getSupabaseAdmin();

  await supabase.from("line_users").upsert(
    {
      line_user_id: userId,
      display_name: profile?.displayName ?? null,
      unfollowed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "line_user_id" },
  );
}

async function markUnfollowed(userId: string) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("line_users")
    .update({ unfollowed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("line_user_id", userId);
}

export async function POST(request: NextRequest) {
  // 署名の検証には加工前の本文が必要
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(rawBody).events ?? []) as LineEvent[];
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  for (const event of events) {
    const userId = event.source?.userId;
    if (!userId) continue;

    try {
      if (event.type === "follow" || event.type === "message") {
        await rememberUser(userId);
      } else if (event.type === "unfollow") {
        await markUnfollowed(userId);
      }
    } catch (err) {
      // 1件の失敗で全体を止めない。LINEには200を返し再送を防ぐ
      console.error("LINE webhook event failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

/** LINEの「検証」ボタンや疎通確認用 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
