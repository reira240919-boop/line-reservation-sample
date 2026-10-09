import "server-only";
import crypto from "crypto";

const LINE_API = "https://api.line.me/v2/bot";

function getChannelSecret(): string {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) throw new Error("LINE_CHANNEL_SECRET が設定されていません");
  return secret;
}

function getAccessToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
  return token;
}

/**
 * Webhookが本当にLINEから送られたものかを確認する（なりすまし防止）。
 * 署名はリクエストの生の本文から計算するため、パース前の文字列を渡すこと。
 */
export function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", getChannelSecret())
    .update(rawBody)
    .digest("base64");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type LineProfile = { userId: string; displayName: string };

/** 友だちの表示名を取得する。取得できなくても処理は続行できるよう null を返す */
export async function fetchProfile(userId: string): Promise<LineProfile | null> {
  try {
    const res = await fetch(`${LINE_API}/profile/${userId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as LineProfile;
  } catch {
    return null;
  }
}

/** 指定した相手にメッセージを送る */
export async function pushMessage(userId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${LINE_API}/message/push`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
