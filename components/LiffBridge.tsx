"use client";

import { useEffect } from "react";

const LINE_UID_COOKIE = "line_uid";

/**
 * 予約ページをLINE内（LIFF）で開いたとき、そのユーザーのLINE IDを取得してCookieに保存する。
 * このIDを予約と一緒に保存することで、後から本人へメッセージを自動送信できるようにする。
 */
/**
 * LINEは「https://liff.line.me/{LIFF ID}/manage/xxx」のようなURLを開いても、
 * 実際には登録済みのエンドポイントURL（/book）を開き、本来の行き先を
 * ?liff.state=... というクエリパラメータに隠して渡してくる。
 * これを読み取って、本来の画面へブラウザごと移動させる。
 */
function redirectToLiffState(): boolean {
  const liffState = new URLSearchParams(window.location.search).get("liff.state");
  if (!liffState) return false;

  const decoded = decodeURIComponent(liffState);
  const path = decoded.startsWith("/") ? decoded : `/${decoded}`;
  const target = path.startsWith("/book") ? path : `/book${path}`;

  if (target === window.location.pathname + window.location.search) return false;

  window.location.replace(target);
  return true;
}

export default function LiffBridge() {
  useEffect(() => {
    if (redirectToLiffState()) return;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) return;
    if (document.cookie.includes(`${LINE_UID_COOKIE}=`)) return;

    let cancelled = false;

    (async () => {
      try {
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        if (cancelled) return;

        const maxAge = 60 * 60 * 24; // 1日
        document.cookie = `${LINE_UID_COOKIE}=${profile.userId}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch (err) {
        console.error("LIFF初期化に失敗しました:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
