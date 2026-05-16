import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Users,
  MapPin,
  Clock,
  FileText,
  Hash,
  User as UserIcon,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getBookingById } from "../actions";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  ACK: "bg-cyan-100 text-cyan-700 border-cyan-200",
  SUPPLIER_CONTACTED: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  VOUCHER_ISSUED: "bg-purple-100 text-purple-700 border-purple-200",
  OPERATED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  NEW: "New",
  ACK: "Acknowledged",
  SUPPLIER_CONTACTED: "Supplier Contacted",
  CONFIRMED: "Confirmed",
  VOUCHER_ISSUED: "Voucher Issued",
  OPERATED: "Operated",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAuth();

  const { id } = await params;
  const { created } = await searchParams;
  const data = await getBookingById(id);

  if (!data) notFound();

  const { booking, productName, productType, countryName, countryFlag } = data;
  const justCreated = created === "1";

  return (
    <div className="space-y-6 max-w-5xl">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to my bookings
      </Link>

      {/* Success banner */}
      {justCreated && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Booking Created Successfully!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Operations team has been notified and will confirm with the supplier shortly.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500 font-mono mb-1">{booking.bookingNo}</p>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{productName}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {productType && (
                <ProductTypeBadge
                  type={productType as "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER"}
                />
              )}
              {countryFlag && (
                <span className="text-sm text-slate-600">
                  {countryFlag} {countryName}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                statusColors[booking.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {statusLabels[booking.status] ?? booking.status}
            </span>
            <p className="text-2xl font-bold text-slate-900">
              ${parseFloat(booking.totalPrice).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <DetailCard title="Booking Details">
          <DetailRow icon={Hash} label="Sales Order #" value={booking.salesOrderNo} mono />
          <DetailRow icon={Hash} label="Booking #" value={booking.bookingNo} mono />
          <DetailRow
            icon={Calendar}
            label="Travel Date"
            value={new Date(booking.travelDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          />
          <DetailRow
            icon={Users}
            label="Passengers"
            value={`${booking.totalPax} total (${booking.adults} adults${
              booking.children ? `, ${booking.children} children` : ""
            }${booking.infants ? `, ${booking.infants} infants` : ""})`}
          />
          {booking.pickupTime && (
            <DetailRow icon={Clock} label="Pickup Time" value={booking.pickupTime} />
          )}
          {booking.pickupLocation && (
            <DetailRow icon={MapPin} label="Pickup Location" value={booking.pickupLocation} />
          )}
          {booking.dropoffLocation && (
            <DetailRow icon={MapPin} label="Dropoff Location" value={booking.dropoffLocation} />
          )}
        </DetailCard>

        {/* Customer Details */}
        <DetailCard title="Customer">
          <DetailRow icon={UserIcon} label="Name" value={booking.customerName} />
          {booking.customerEmail && <DetailRow label="Email" value={booking.customerEmail} />}
          {booking.customerPhone && <DetailRow label="Phone" value={booking.customerPhone} />}
          {booking.customerCountry && (
            <DetailRow label="Country of Residence" value={booking.customerCountry} />
          )}
          {booking.customerNationality && (
            <DetailRow label="Nationality" value={booking.customerNationality} />
          )}
        </DetailCard>

        {/* Notes (full width) */}
        {(booking.specialRequests || booking.internalNotes) && (
          <div className="lg:col-span-2 space-y-4">
            {booking.specialRequests && (
              <DetailCard title="Customer Special Requests">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {booking.specialRequests}
                </p>
              </DetailCard>
            )}
            {booking.internalNotes && (
              <DetailCard title="Internal Notes (Ops Only)">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {booking.internalNotes}
                </p>
              </DetailCard>
            )}
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Price Breakdown</h2>
        <div className="space-y-2">
          {booking.adults > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {booking.adults} × Adult @ ${parseFloat(booking.unitAdult).toFixed(2)}
              </span>
              <span className="font-medium text-slate-900">
                ${(booking.adults * parseFloat(booking.unitAdult)).toFixed(2)}
              </span>
            </div>
          )}
          {booking.children > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {booking.children} × Child @ ${parseFloat(booking.unitChild).toFixed(2)}
              </span>
              <span className="font-medium text-slate-900">
                ${(booking.children * parseFloat(booking.unitChild)).toFixed(2)}
              </span>
            </div>
          )}
          {booking.infants > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                {booking.infants} × Infant @ ${parseFloat(booking.unitInfant).toFixed(2)}
              </span>
              <span className="font-medium text-slate-900">
                ${(booking.infants * parseFloat(booking.unitInfant)).toFixed(2)}
              </span>
            </div>
          )}
          <div className="pt-3 mt-3 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-base font-semibold text-slate-900">Total</span>
            <p className="text-2xl font-bold text-slate-900">
              ${parseFloat(booking.totalPrice).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
