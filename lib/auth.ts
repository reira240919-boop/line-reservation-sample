import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionCookieValue,
  isSessionValueValid,
} from "./session";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isSessionValueValid(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}

/**
 * Secure 付きの Cookie は HTTPS でないと保存されない（localhost は例外）。
 * 社内LANのIP経由（http）での動作確認ができるよう、実際の接続方式で判定する。
 * Vercel など HTTPS 環境では x-forwarded-proto が https になり Secure が付く。
 */
async function isHttpsRequest(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return proto === "https";
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: await isHttpsRequest(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
