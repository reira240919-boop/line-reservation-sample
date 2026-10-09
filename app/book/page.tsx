import { buildWeekStatusGrid } from "@/lib/booking-grid";
import BookingSteps from "@/components/BookingSteps";
import BookingPicker from "./BookingPicker";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week: weekParam } = await searchParams;
  const weekOffset = Number(weekParam ?? 0) || 0;

  const { weekDates, rowTimes, statusGrid } = await buildWeekStatusGrid(weekOffset);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-1 inline-block rounded bg-sage-100 px-2 py-1 text-xs font-bold text-sage-700">
        所要時間 60分
      </div>
      <h1 className="mb-4 text-xl font-bold text-sand-900">無料相談のご予約</h1>
      <BookingSteps current={1} />

      <div className="mt-5">
        <BookingPicker
          weekOffset={weekOffset}
          weekDates={weekDates}
          rowTimes={rowTimes}
          statusGrid={statusGrid}
          weekBasePath="/book"
          nextBasePath="/book/details"
        />
      </div>
    </main>
  );
}
