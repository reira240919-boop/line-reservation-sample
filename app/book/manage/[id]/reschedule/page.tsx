import { redirect } from "next/navigation";
import { getOwnedBooking } from "@/lib/booking-ownership";
import { isWithinClientManageWindow } from "@/lib/manage-window";
import { buildWeekStatusGrid } from "@/lib/booking-grid";
import BookingSteps from "@/components/BookingSteps";
import BookingPicker from "@/app/book/BookingPicker";

export const dynamic = "force-dynamic";

export default async function RescheduleBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { id } = await params;
  const { week: weekParam } = await searchParams;
  const weekOffset = Number(weekParam ?? 0) || 0;

  const booking = await getOwnedBooking(id);
  if (
    !booking ||
    booking.status !== "confirmed" ||
    booking.client_reschedule_used ||
    !isWithinClientManageWindow(booking.date)
  ) {
    redirect(`/book/manage/${id}`);
  }

  const { weekDates, rowTimes, statusGrid } = await buildWeekStatusGrid(weekOffset, id);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-1 inline-block rounded bg-sage-100 px-2 py-1 text-xs font-bold text-sage-700">
        所要時間 60分
      </div>
      <h1 className="mb-4 text-xl font-bold text-sand-900">日程の変更</h1>
      <BookingSteps current={1} />

      <div className="mt-5">
        <BookingPicker
          weekOffset={weekOffset}
          weekDates={weekDates}
          rowTimes={rowTimes}
          statusGrid={statusGrid}
          weekBasePath={`/book/manage/${id}/reschedule`}
          nextBasePath={`/book/manage/${id}/reschedule/confirm`}
        />
      </div>
    </main>
  );
}
