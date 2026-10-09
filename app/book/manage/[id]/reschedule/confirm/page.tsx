import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedBooking } from "@/lib/booking-ownership";
import { isWithinClientManageWindow } from "@/lib/manage-window";
import { getSlotStatus } from "@/lib/slot-availability";
import { formatJapaneseDate } from "@/lib/date";
import { timeToMinutes, minutesToTime } from "@/lib/schedule";
import RescheduleConfirmForm from "./RescheduleConfirmForm";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  taken: "その時間は他の方の予約が入ってしまいました。恐れ入りますが別の日時をお選びください",
  window: "受付期間の都合により、その日程には変更できません",
};

export default async function RescheduleConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; start?: string; error?: string }>;
}) {
  const { id } = await params;
  const { date, start, error } = await searchParams;

  if (!date || !start || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) {
    redirect(`/book/manage/${id}/reschedule`);
  }

  const booking = await getOwnedBooking(id);
  if (!booking || booking.status !== "confirmed" || !isWithinClientManageWindow(booking.date)) {
    redirect(`/book/manage/${id}`);
  }

  const status = await getSlotStatus(date, start, id);
  const end = minutesToTime(timeToMinutes(start) + 60);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-sand-900">日程の変更</h1>

      {status !== "available" ? (
        <div className="rounded-lg border border-sand-200 bg-white p-5 text-center">
          <p className="text-sm text-sand-700">
            {error && ERROR_MESSAGES[error] ? ERROR_MESSAGES[error] : "その時間は選択できなくなりました。"}
          </p>
          <Link
            href={`/book/manage/${id}/reschedule`}
            className="mt-3 inline-block rounded-lg bg-sage-600 px-4 py-2 text-sm font-bold text-white hover:bg-sage-700"
          >
            日程選択に戻る
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-sand-100 p-4">
            <p className="text-xs text-sand-500">変更前</p>
            <p className="text-sm text-sand-600 line-through decoration-sand-400">
              {formatJapaneseDate(booking.date)}　{booking.start_time.slice(0, 5)} −{" "}
              {booking.end_time.slice(0, 5)}
            </p>
            <p className="mt-3 text-xs text-sand-500">変更後</p>
            <p className="text-base font-bold text-sand-900">
              {formatJapaneseDate(date)}　{start} − {end}
            </p>
            <Link
              href={`/book/manage/${id}/reschedule`}
              className="mt-2 inline-block text-sm text-sage-700 underline"
            >
              日程選択に戻る
            </Link>
          </div>

          <RescheduleConfirmForm bookingId={id} date={date} start={start} />
        </>
      )}
    </main>
  );
}
