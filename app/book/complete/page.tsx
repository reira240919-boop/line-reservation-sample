import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatJapaneseDate } from "@/lib/date";
import BookingSteps from "@/components/BookingSteps";

export const dynamic = "force-dynamic";

export default async function BookingCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const supabase = getSupabaseAdmin();
  const { data: booking } = id
    ? await supabase
        .from("bookings")
        .select("date, start_time, end_time, client_name, status")
        .eq("id", id)
        .eq("status", "confirmed")
        .maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-1 inline-block rounded bg-sage-100 px-2 py-1 text-xs font-bold text-sage-700">
        所要時間 60分
      </div>
      <h1 className="mb-4 text-xl font-bold text-sand-900">無料相談のご予約</h1>
      <BookingSteps current={3} />

      <div className="mt-6 rounded-lg border border-sand-200 bg-white p-6 text-center">
        {booking ? (
          <>
            <p className="text-2xl">🌿</p>
            <p className="mt-3 text-base font-bold text-sand-900">ご予約が完了しました</p>
            <p className="mt-4 rounded-lg bg-sand-100 p-4 text-sm">
              <span className="block font-bold text-sand-900">
                {formatJapaneseDate(booking.date)}　{booking.start_time.slice(0, 5)} −{" "}
                {booking.end_time.slice(0, 5)}
              </span>
              <span className="mt-1 block text-sand-600">{booking.client_name} 様</span>
            </p>
            <p className="mt-4 text-xs text-sand-400">当日はどうぞよろしくお願いいたします。</p>
          </>
        ) : (
          <p className="text-sm text-sand-600">予約情報が見つかりませんでした。</p>
        )}
        <Link href="/book" className="mt-5 inline-block text-sm text-sage-700 underline">
          トップに戻る
        </Link>
      </div>
    </main>
  );
}
