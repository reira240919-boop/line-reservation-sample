"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/logout-action";

const NAV_LINKS = [
  { href: "/dashboard", label: "予約一覧" },
  { href: "/settings/blocked-dates", label: "予約枠管理" },
  { href: "/settings/availability", label: "受付時間設定" },
  { href: "/settings/messages", label: "メッセージ設定" },
  { href: "/settings/account", label: "アカウント設定" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-sand-200 bg-sage-50">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex gap-1.5 overflow-x-auto text-sm font-medium">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 ${
                  active
                    ? "bg-sage-600 text-white"
                    : "text-sage-800 hover:bg-sage-100 hover:text-sage-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <form action={logoutAction}>
          <button type="submit" className="shrink-0 text-sm text-sand-500 hover:text-sand-800">
            ログアウト
          </button>
        </form>
      </div>
    </nav>
  );
}
