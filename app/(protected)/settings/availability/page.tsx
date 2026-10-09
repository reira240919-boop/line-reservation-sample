import { getSupabaseAdmin } from "@/lib/supabase-admin";
import AvailabilityForm from "./AvailabilityForm";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const supabase = getSupabaseAdmin();
  const [{ data }, { data: therapist }] = await Promise.all([
    supabase.from("availability").select("day_of_week, start_time, end_time"),
    supabase
      .from("therapists")
      .select("booking_window_days, min_booking_lead_minutes")
      .limit(1)
      .maybeSingle(),
  ]);

  const byDay = new Map((data ?? []).map((row) => [row.day_of_week, row]));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sand-900">受付時間設定</h1>
      <p className="mt-1 text-sm text-sand-500">
        曜日ごとの受付時間帯を設定します。空欄の曜日は受付なしになります。
      </p>

      <AvailabilityForm
        byDay={byDay}
        bookingWindowDays={therapist?.booking_window_days ?? 60}
        minBookingLeadMinutes={therapist?.min_booking_lead_minutes ?? 60}
      />
    </div>
  );
}
