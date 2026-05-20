import { requireAuth } from "@/lib/auth-utils";
import { getMyBookings, getMyHotelBookings } from "./actions";
import { MyBookingsTabs } from "./my-bookings-tabs";

export default async function MyBookingsPage() {
  await requireAuth();

  const [tourBookings, hotelBookingsData] = await Promise.all([
    getMyBookings(),
    getMyHotelBookings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-slate-500 mt-1">
          All your tour and hotel reservations in one place
        </p>
      </div>

      <MyBookingsTabs
        tourBookings={tourBookings}
        hotelBookings={hotelBookingsData}
      />
    </div>
  );
}
