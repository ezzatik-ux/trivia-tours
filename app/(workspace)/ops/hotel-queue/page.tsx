import { requireRole } from "@/lib/auth-utils";
import { getHotelBookingsQueue } from "./actions";
import { HotelQueueTable } from "./hotel-queue-table";

export default async function HotelQueuePage() {
  const user = await requireRole(["OPS", "ADMIN"]);
  const bookings = await getHotelBookingsQueue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hotel Booking Queue</h1>
        <p className="text-slate-500 mt-1">
          Manage hotel reservations — confirm with hotels, issue vouchers, track status
        </p>
      </div>

      <HotelQueueTable bookings={bookings} currentUserId={user.id} />
    </div>
  );
}
