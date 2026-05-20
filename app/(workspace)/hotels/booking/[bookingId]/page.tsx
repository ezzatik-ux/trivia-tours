import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Calendar, User, Hotel as HotelIcon, ArrowRight, Clock, MapPin } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getHotelBookingById } from "../../actions";
import { CountryFlag } from "@/components/ui/country-flag";

export default async function HotelBookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  await requireAuth();
  const { bookingId } = await params;

  const booking = await getHotelBookingById(bookingId);
  if (!booking) notFound();

  const totalPrice = Number(booking.totalPrice);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success header */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Booking submitted!</h1>
        <p className="text-slate-700">
          Your request is in the Ops queue. They&apos;ll contact the hotel and confirm shortly.
        </p>
      </div>

      {/* Booking info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Booking Number
            </p>
            <p className="text-xl font-mono font-bold text-slate-900">{booking.bookingNo}</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase">
            {booking.status}
          </span>
        </div>

        {/* Hotel */}
        <Field icon={HotelIcon} label="Hotel">
          <div className="font-semibold text-slate-900">{booking.hotelName}</div>
          {booking.hotelBrand && (
            <div className="text-xs text-slate-500">{booking.hotelBrand}</div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {booking.countryCode && (
              <CountryFlag code={booking.countryCode} name={booking.countryName} />
            )}
            <span>{booking.countryName}</span>
          </div>
        </Field>

        {/* Room */}
        <Field icon={HotelIcon} label="Room">
          <div className="font-medium text-slate-900">{booking.roomTypeName}</div>
          <div className="text-sm text-slate-600 mt-1">
            {booking.numRooms} {booking.numRooms === 1 ? "room" : "rooms"} ·{" "}
            {booking.occupancy?.toLowerCase()}
          </div>
        </Field>

        {/* Stay */}
        <Field icon={Calendar} label="Stay">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500">Check-in</div>
              <div className="font-medium text-slate-900">{formatDate(booking.checkIn)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Check-out</div>
              <div className="font-medium text-slate-900">{formatDate(booking.checkOut)}</div>
            </div>
          </div>
          <div className="text-sm text-slate-600 mt-2">
            {booking.nights} {booking.nights === 1 ? "night" : "nights"} · {booking.adults} adults
            {booking.children > 0 && `, ${booking.children} children`}
          </div>
        </Field>

        {/* Customer */}
        <Field icon={User} label="Customer">
          <div className="font-medium text-slate-900">{booking.customerName}</div>
          {booking.customerEmail && (
            <div className="text-sm text-slate-600 mt-0.5">{booking.customerEmail}</div>
          )}
          {booking.customerPhone && (
            <div className="text-sm text-slate-600 mt-0.5">{booking.customerPhone}</div>
          )}
        </Field>

        {/* Special requests */}
        {booking.specialRequests && (
          <Field icon={Clock} label="Special requests">
            <p className="text-sm text-slate-700">{booking.specialRequests}</p>
          </Field>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-900">Total amount</span>
          <span className="text-2xl font-bold text-trivia-600">${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-900 mb-3">What happens next?</h3>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-bold text-blue-700">1.</span>
            Ops team receives this booking in their queue
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-700">2.</span>
            Ops contacts the hotel to confirm availability
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-700">3.</span>
            Once confirmed, you&apos;ll get a notification
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-700">4.</span>
            Hotel voucher PDF will be issued for the customer
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/hotels"
          className="flex-1 px-5 py-3 text-center bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Book another hotel
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/bookings"
          className="flex-1 px-5 py-3 text-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
        >
          View all my bookings
        </Link>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}
