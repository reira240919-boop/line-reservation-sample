import Link from "next/link";
import { getOwnedBooking } from "@/lib/booking-ownership";
import { isWithinClientManageWindow, CLIENT_MANAGE_MIN_DAYS } from "@/lib/manage-window";
import { formatJapaneseDate } from "@/lib/date";
import CancelBookingButton from "./CancelBookingButton";

export const dynamic = "force-dynamic";

const DONE_MESSAGES: Record<string, string> = {
  rescheduled: "日程の変更が完了しました",
  cancelled: "キャンセルが完了しました",
};

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  const booking = await getOwnedBooking(id);
  const doneMessage = done ? DONE_MESSAGES[done] : undefined;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-sand-900">ご予約の確認</h1>

      {doneMessage && (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-sage-100 px-4 py-3 text-sm font-bold text-sage-800">
          <span aria-hidden>✓</span>
          {doneMessage}
        </p>
      )}

      {!booking ? (
        <div className="rounded-lg border border-sand-200 bg-white p-5 text-center">
          <p className="text-sm text-sand-700">ご予約が見つかりませんでした。</p>
        </div>
      ) : booking.status === "cancelled" ? (
        <div className="rounded-lg border border-sand-200 bg-white p-5 text-center">
          <p className="text-sm text-sand-700">このご予約はキャンセル済みです。</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-sand-100 p-4">
            <p className="text-xs text-sand-500">ご予約日時</p>
            <p className="text-base font-bold text-sand-900">
              {formatJapaneseDate(booking.date)}　{booking.start_time.slice(0, 5)} −{" "}
              {booking.end_time.slice(0, 5)}
            </p>
            <p className="mt-2 text-sm text-sand-600">{booking.client_name} 様</p>
            {booking.concerns.length > 0 && (
              <p className="mt-1 text-xs text-sand-400">ご相談：{booking.concerns.join("・")}</p>
            )}
          </div>

          {isWithinClientManageWindow(booking.date) ? (
            booking.client_reschedule_used ? (
              <p className="mt-6 rounded-lg bg-sand-50 px-4 py-3 text-sm leading-relaxed text-sand-600">
                日程の変更は1回のみご利用いただけます。再度の変更・キャンセルをご希望の場合は、お手数ですがLINEでご連絡ください。
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                <Link
                  href={`/book/manage/${booking.id}/reschedule`}
                  className="block w-full rounded-lg bg-sage-600 px-4 py-3 text-center font-bold text-white hover:bg-sage-700"
                >
                  日程を変更する
                </Link>
                <CancelBookingButton bookingId={booking.id} />
              </div>
            )
          ) : (
            <p className="mt-6 rounded-lg bg-sand-50 px-4 py-3 text-sm leading-relaxed text-sand-600">
              相談日の{CLIENT_MANAGE_MIN_DAYS}
              日前を過ぎているため、こちらでの変更・キャンセルは受け付けておりません。恐れ入りますが、ご都合が悪くなった場合はLINEのトークからご連絡ください。
            </p>
          )}
        </>
      )}
    </main>
  );
}
