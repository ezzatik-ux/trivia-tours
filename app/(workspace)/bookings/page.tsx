import { requireAuth } from "@/lib/auth-utils";
import { getMyBookings } from "./actions";
import { BookingsTable } from "./bookings-table";

export default async function BookingsPage() {
  await requireAuth();

  const bookings = await getMyBookings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-slate-500 mt-1">
          Track and manage all your bookings
        </p>
      </div>

      <BookingsTable bookings={bookings} />
    </div>
  );
}
