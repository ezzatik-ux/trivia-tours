import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTransferBookingById } from "../../actions";
import type { TransferVehicleClassInfo } from "@/lib/transfer-options";
import { CheckCircle2, MapPin, ArrowRight, Calendar, Clock, Plane, Users, Car, Briefcase, Search } from "lucide-react";

const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", VAN: "Van", MINIBUS: "Minibus", COACH: "Coach",
};

export default async function TransferBookingConfirmation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const b = (await getTransferBookingById(id)) as (Record<string, unknown> & {
    vehicleClass: TransferVehicleClassInfo | null;
    vehicle_type: string;
    num_vehicles: number;
  }) | null;

  if (!b) redirect("/transfers");

  const cls = b.vehicleClass;
  const legacyLabel = VEHICLE_LABELS[b.vehicle_type] ?? b.vehicle_type;
  const classDisplayName = cls?.name ?? legacyLabel;
  const classMaxPax = cls?.maxPax ?? null;
  const classMaxLuggage = cls?.maxLuggage ?? null;
  const classAmenities = cls?.amenities ?? [];

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 p-5 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Transfer booked</h1>
            <p className="text-sm text-slate-600">
              Booking <span className="font-semibold">{b.booking_no}</span> sent to operations
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <MapPin className="w-4 h-4 text-trivia-500" />
            {b.from_name}
            <ArrowRight className="w-4 h-4 text-slate-400" />
            {b.to_name}
            {b.trip_type === "ROUND_TRIP" && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-trivia-50 text-trivia-700">ROUND TRIP</span>
            )}
          </div>

          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="w-16 h-12 flex-shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
              {cls?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cls.imageUrl} alt={classDisplayName} className="w-full h-full object-cover" />
              ) : (
                <Car className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-sm">{classDisplayName}</div>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-600">
                {classMaxPax != null && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to {classMaxPax}</span>
                )}
                {classMaxLuggage != null && (
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {classMaxLuggage} bags</span>
                )}
                <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {b.num_vehicles} vehicle{b.num_vehicles === 1 ? "" : "s"}</span>
              </div>
              {classAmenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {classAmenities.map((a) => (
                    <span key={a} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-white text-slate-600 border border-slate-200">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-slate-400" /> {fmtDate(b.transfer_date)}</div>
            {b.pickup_time && <div className="flex items-center gap-2 text-slate-600"><Clock className="w-4 h-4 text-slate-400" /> {b.pickup_time}</div>}
            {b.flight_number && <div className="flex items-center gap-2 text-slate-600"><Plane className="w-4 h-4 text-slate-400" /> {b.flight_number}</div>}
            {b.arrival_terminal && (
              <div className="flex items-center gap-2 text-slate-600">Terminal {b.arrival_terminal}</div>
            )}
            {b.greeting_sign && (
              <div className="col-span-2 flex items-center gap-2 text-slate-600">
                <span className="text-slate-500 font-medium">Sign:</span> {b.greeting_sign}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600"><Users className="w-4 h-4 text-slate-400" /> {b.pax} pax</div>
          </div>

          {b.trip_type === "ROUND_TRIP" && (
            <div className="rounded-xl border border-trivia-100 bg-trivia-50/40 p-3 space-y-2">
              <div className="flex items-center gap-2 text-trivia-700 font-semibold text-sm">
                <ArrowRight className="w-4 h-4" /> Round trip — return journey
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" /> {b.return_date ? fmtDate(b.return_date) : "—"}
                </div>
                {b.return_pickup_time && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" /> {b.return_pickup_time}
                  </div>
                )}
                {b.return_flight_number && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Plane className="w-4 h-4 text-slate-400" /> {b.return_flight_number}
                  </div>
                )}
                {b.return_terminal && (
                  <div className="flex items-center gap-2 text-slate-600">
                    Terminal {b.return_terminal}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500 mb-1">Customer</div>
            <div className="font-medium text-slate-900">{b.customer_name}</div>
            {b.customer_phone && <div className="text-sm text-slate-600">{b.customer_phone}</div>}
            {b.customer_email && <div className="text-sm text-slate-600">{b.customer_email}</div>}
          </div>

          {b.special_requests && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-900">
              <span className="font-medium">Special requests:</span> {b.special_requests}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="text-2xl font-bold text-trivia-600">${Number(b.total_price).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/transfers" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl text-sm font-medium">
          <Search className="w-4 h-4" /> Book another transfer
        </Link>
      </div>
    </div>
  );
}
