import Link from "next/link";
import { redirect } from "next/navigation";
import BookingSteps from "@/components/BookingSteps";
import { formatJapaneseDate } from "@/lib/date";
import { timeToMinutes, minutesToTime } from "@/lib/schedule";
import { getSlotStatus } from "@/lib/slot-availability";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  name: "お名前を入力してください",
  concerns: "相談したい悩みを1つ以上選んでください",
  taken: "その時間は他の方の予約が入ってしまいました。恐れ入りますが別の日時をお選びください",
};

export default async function BookingDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; start?: string; error?: string }>;
}) {
  const { date, start, error } = await searchParams;

  if (!date || !start || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) {
    redirect("/book");
  }

  const status = await getSlotStatus(date, start);
  const end = minutesToTime(timeToMinutes(start) + 60);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-1 inline-block rounded bg-sage-100 px-2 py-1 text-xs font-bold text-sage-700">
        所要時間 60分
      </div>
      <h1 className="mb-4 text-xl font-bold text-sand-900">無料相談のご予約</h1>
      <BookingSteps current={2} />

      {status !== "available" ? (
        <div className="mt-6 rounded-lg border border-sand-200 bg-white p-5 text-center">
          <p className="text-sm text-sand-700">申し訳ございません。その時間は選択できなくなりました。</p>
          <Link
            href="/book"
            className="mt-3 inline-block rounded-lg bg-sage-600 px-4 py-2 text-sm font-bold text-white hover:bg-sage-700"
          >
            日程選択に戻る
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-lg bg-sand-100 p-4">
            <p className="text-xs text-sand-500">選択中の日程</p>
            <p className="text-base font-bold text-sand-900">
              {formatJapaneseDate(date)}　{start} − {end}
            </p>
            <Link href="/book" className="mt-2 inline-block text-sm text-sage-700 underline">
              日程選択に戻る
            </Link>
          </div>

          {error && ERROR_MESSAGES[error] && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              {ERROR_MESSAGES[error]}
            </p>
          )}

          <BookingForm date={date} start={start} />
        </>
      )}
    </main>
  );
}
