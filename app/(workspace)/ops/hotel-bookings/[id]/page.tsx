import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Bed,
  DollarSign,
  Mail,
  Phone,
  Globe,
  Hotel as HotelIcon,
  FileText,
  FileDown,
} from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getHotelBookingDetail } from "../../hotel-queue/actions";
import { StatusPipeline } from "./status-pipeline";
import { StatusActions } from "./status-actions";
import { EmailTemplate } from "./email-template";
import { ConfirmationRefs } from "./confirmation-refs";
import { StatusHistory } from "./status-history";
import { CountryFlag } from "@/components/ui/country-flag";

const STATUS_BADGE_COLORS: Record<string, string> = {
  NEW: "bg-red-100 text-red-700",
  ACK: "bg-blue-100 text-blue-700",
  HOTEL_CONTACTED: "bg-amber-100 text-amber-700",
  AWAITING_INVOICE: "bg-purple-100 text-purple-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  VOUCHER_ISSUED: "bg-teal-100 text-teal-700",
  CHECKED_IN: "bg-cyan-100 text-cyan-700",
  CHECKED_OUT: "bg-slate-200 text-slate-700",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function HotelBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OPS", "ADMIN"]);

  const { id } = await params;
  const booking = await getHotelBookingDetail(id);

  if (!booking) notFound();

  const totalPrice = Number(booking.totalPrice);
  const netCost = Number(booking.netCost ?? 0);
  const unitRate = Number(booking.unitRate);
  const margin = totalPrice - netCost;
  const marginPct = netCost > 0 ? (margin / netCost) * 100 : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <Link
        href="/ops/hotel-queue"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Hotel Queue
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900 font-mono">
              {booking.bookingNo}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                STATUS_BADGE_COLORS[booking.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            {booking.customerName} · {booking.hotelName}
          </p>
        </div>

        {/* Voucher download button (only after CONFIRMED) */}
        {["CONFIRMED", "VOUCHER_ISSUED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED"].includes(
          booking.status
        ) && (
          <a
            href={`/api/voucher/hotel/${booking.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            Download Voucher
          </a>
        )}
      </div>

      {/* Status Pipeline */}
      <StatusPipeline currentStatus={booking.status} />

      {/* Status Actions */}
      <StatusActions bookingId={booking.id} currentStatus={booking.status} />

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Booking summary (read-only) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Hotel */}
          <InfoCard icon={HotelIcon} title="Hotel">
            <div className="font-semibold text-slate-900">{booking.hotelName}</div>
            {booking.hotelBrand && (
              <div className="text-xs text-slate-500 mt-0.5">{booking.hotelBrand}</div>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {booking.countryCode && (
                <CountryFlag code={booking.countryCode} name={booking.countryName} />
              )}
              <span>{booking.countryName}</span>
            </div>
            {booking.hotelAddress && (
              <p className="text-xs text-slate-500 mt-1">{booking.hotelAddress}</p>
            )}
            {booking.hotelContactPhone && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                {booking.hotelContactPhone}
              </div>
            )}
          </InfoCard>

          {/* Customer */}
          <InfoCard icon={User} title="Customer">
            <div className="font-semibold text-slate-900">{booking.customerName}</div>
            {booking.customerEmail && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {booking.customerEmail}
              </div>
            )}
            {booking.customerPhone && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {booking.customerPhone}
              </div>
            )}
            {booking.customerNationality && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {booking.customerNationality}
              </div>
            )}
          </InfoCard>

          {/* Stay */}
          <InfoCard icon={Calendar} title="Stay">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Check-in</div>
                <div className="font-medium text-slate-900 text-sm">{formatDate(booking.checkIn)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Check-out</div>
                <div className="font-medium text-slate-900 text-sm">{formatDate(booking.checkOut)}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-700 space-y-0.5">
              <div>
                {booking.nights} {booking.nights === 1 ? "night" : "nights"}
              </div>
              <div>
                {booking.adults} adult{booking.adults > 1 ? "s" : ""}
                {booking.children > 0 && `, ${booking.children} children`}
                {booking.infants > 0 && `, ${booking.infants} infants`}
              </div>
            </div>
          </InfoCard>

          {/* Room */}
          <InfoCard icon={Bed} title="Room">
            <div className="font-medium text-slate-900">{booking.roomTypeName}</div>
            <div className="text-xs text-slate-500 mt-1">
              {booking.numRooms} {booking.numRooms === 1 ? "room" : "rooms"} ·{" "}
              {booking.occupancy?.toLowerCase()}
            </div>
            {booking.roomBedConfig && (
              <div className="text-xs text-slate-500 mt-0.5">{booking.roomBedConfig}</div>
            )}
            {booking.rateMealPlan && (
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-bold">
                {booking.rateMealPlan} · {MEAL_PLAN_LABELS[booking.rateMealPlan]}
              </div>
            )}
          </InfoCard>

          {/* Pricing */}
          <InfoCard icon={DollarSign} title="Pricing">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Unit rate</span>
                <span className="font-mono text-slate-900">${unitRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Net cost (to hotel)</span>
                <span className="font-mono text-slate-900">${netCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100">
                <span className="font-medium text-slate-700">Total (customer)</span>
                <span className="font-mono font-bold text-trivia-600">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-emerald-700">Margin</span>
                <span className="font-mono font-medium text-emerald-700">
                  ${margin.toFixed(2)} ({marginPct.toFixed(0)}%)
                </span>
              </div>
            </div>
          </InfoCard>

          {/* Special requests */}
          {booking.specialRequests && (
            <InfoCard icon={FileText} title="Special Requests">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{booking.specialRequests}</p>
            </InfoCard>
          )}
        </div>

        {/* Right: Action panels */}
        <div className="lg:col-span-2 space-y-4">
          {/* Email template */}
          <EmailTemplate
            bookingId={booking.id}
            bookingNo={booking.bookingNo}
            hotelName={booking.hotelName}
            hotelReservationEmail={booking.hotelReservationEmail}
            customerName={booking.customerName}
            customerNationality={booking.customerNationality}
            checkIn={booking.checkIn}
            checkOut={booking.checkOut}
            nights={booking.nights}
            numRooms={booking.numRooms}
            occupancy={booking.occupancy ?? "DOUBLE"}
            adults={booking.adults}
            children={booking.children}
            roomTypeName={booking.roomTypeName}
            roomBedConfig={booking.roomBedConfig}
            roomView={booking.roomView}
            mealPlan={booking.rateMealPlan}
            specialRequests={booking.specialRequests}
            emailSentToHotel={booking.emailSentToHotel ?? false}
            emailSentAt={booking.emailSentAt}
          />

          {/* Confirmation refs */}
          <ConfirmationRefs
            bookingId={booking.id}
            hotelConfirmationRef={booking.hotelConfirmationRef}
            invoiceNoOdoo={booking.invoiceNoOdoo}
            internalNotes={booking.internalNotes}
          />

          {/* History */}
          <StatusHistory history={booking.history} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      {children}
    </div>
  );
}
