import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Clock,
  Mail,
  Phone,
  Globe,
  User as UserIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { bookings, products, countries, suppliers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";
import { BookingStatusBadge } from "@/components/ui/booking-status-badge";
import { UrgencyBadge } from "@/components/ui/urgency-badge";
import { StatusPipeline } from "./status-pipeline";
import { SupplierBox } from "./supplier-box";
import { InternalNotes } from "./internal-notes";
import { StatusHistory } from "./status-history";
import { getStatusHistory } from "./actions";
import { VoucherButton } from "./voucher/voucher-button";

export default async function OpsBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OPS", "ADMIN"]);

  const { id } = await params;

  const [bookingData] = await db
    .select({
      booking: bookings,
      productName: products.name,
      productType: products.type,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
      supplierName: suppliers.name,
      supplierEmail: suppliers.contactEmail,
      supplierPhone: suppliers.contactPhone,
      salesAgentName: users.name,
      salesAgentEmail: users.email,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .leftJoin(suppliers, eq(bookings.supplierId, suppliers.id))
    .leftJoin(users, eq(bookings.salesAgentId, users.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!bookingData) notFound();

  const history = await getStatusHistory(id);

  const {
    booking,
    productName,
    productType,
    countryName,
    countryFlag,
    supplierName,
    supplierEmail,
    supplierPhone,
    salesAgentName,
    salesAgentEmail,
  } = bookingData;

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href="/ops/queue"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to queue
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
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
              <BookingStatusBadge status={booking.status} />
              <UrgencyBadge travelDate={booking.travelDate} status={booking.status} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{productName}</h1>
            <p className="font-mono text-sm text-slate-500">
              {booking.bookingNo} · SO: {booking.salesOrderNo}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Total
            </p>
            <p className="text-2xl font-bold text-slate-900">
              ${parseFloat(booking.totalPrice).toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Net cost: ${parseFloat(booking.netCost).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <StatusPipeline bookingId={id} currentStatus={booking.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DetailCard title="Booking Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={`${booking.totalPax} total (${booking.adults}A${
                  booking.children ? `+${booking.children}C` : ""
                }${booking.infants ? `+${booking.infants}I` : ""})`}
              />
              {booking.pickupTime && (
                <DetailRow icon={Clock} label="Pickup Time" value={booking.pickupTime} />
              )}
              {booking.pickupLocation && (
                <DetailRow icon={MapPin} label="Pickup Location" value={booking.pickupLocation} />
              )}
              {booking.dropoffLocation && (
                <DetailRow
                  icon={MapPin}
                  label="Dropoff Location"
                  value={booking.dropoffLocation}
                />
              )}
            </div>
          </DetailCard>

          <DetailCard title="Customer">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailRow icon={UserIcon} label="Name" value={booking.customerName} />
              {booking.customerEmail && (
                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={booking.customerEmail}
                  link={`mailto:${booking.customerEmail}`}
                />
              )}
              {booking.customerPhone && (
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={booking.customerPhone}
                  link={`tel:${booking.customerPhone}`}
                />
              )}
              {booking.customerCountry && (
                <DetailRow icon={Globe} label="Country" value={booking.customerCountry} />
              )}
              {booking.customerNationality && (
                <DetailRow label="Nationality" value={booking.customerNationality} />
              )}
            </div>
          </DetailCard>

          {booking.specialRequests && (
            <DetailCard title="Customer Special Requests">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {booking.specialRequests}
              </p>
            </DetailCard>
          )}

          <StatusHistory history={history} />
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-2">
              Sales Agent
            </p>
            <p className="font-medium text-slate-900">{salesAgentName || "Unknown"}</p>
            {salesAgentEmail && (
              <a
                href={`mailto:${salesAgentEmail}`}
                className="text-sm text-slate-600 hover:underline mt-0.5 block"
              >
                {salesAgentEmail}
              </a>
            )}
          </div>

          <SupplierBox
            bookingId={id}
            initialSupplierRef={booking.supplierRef}
            supplierName={supplierName}
          />

          <VoucherButton
            bookingId={id}
            bookingNo={booking.bookingNo}
            bookingStatus={booking.status}
          />

          {(supplierEmail || supplierPhone) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-3">
                Supplier Contact
              </p>
              <div className="space-y-2">
                {supplierEmail && (
                  <a
                    href={`mailto:${supplierEmail}`}
                    className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 hover:underline"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    {supplierEmail}
                  </a>
                )}
                {supplierPhone && (
                  <a
                    href={`tel:${supplierPhone}`}
                    className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 hover:underline"
                  >
                    <Phone className="w-4 h-4 text-slate-400" />
                    {supplierPhone}
                  </a>
                )}
              </div>
            </div>
          )}

          <InternalNotes bookingId={id} initialNotes={booking.internalNotes} />
        </div>
      </div>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  link?: string;
}) {
  const content = (
    <>
      {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900">{value}</p>
      </div>
    </>
  );

  if (link) {
    return (
      <a
        href={link}
        className="flex items-start gap-3 hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-start gap-3">{content}</div>;
}
