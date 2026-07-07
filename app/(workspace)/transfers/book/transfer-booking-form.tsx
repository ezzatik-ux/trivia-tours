"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Car, Users, Briefcase, Clock, MapPin, ArrowRight,
  Plane, User, Loader2,
} from "lucide-react";
import { createTransferBooking, type TransferBookingContext } from "../actions";
import { TransferInclusions } from "../transfer-inclusions";

type Props = {
  context: TransferBookingContext;
  defaultDate: string;
  defaultPax: number;
};

const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", VAN: "Van", MINIBUS: "Minibus", COACH: "Coach",
};

export function TransferBookingForm({ context, defaultDate, defaultPax }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const suggestedVehicles = Math.max(1, Math.ceil(defaultPax / context.maxPax));

  const [numVehicles, setNumVehicles] = useState(suggestedVehicles);
  const [transferDate, setTransferDate] = useState(defaultDate);
  const [pickupTime, setPickupTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [pax, setPax] = useState(defaultPax);
  const [luggageCount, setLuggageCount] = useState<number | "">("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNationality, setCustomerNationality] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [tripType, setTripType] = useState<"ONE_WAY" | "ROUND_TRIP">("ONE_WAY");
  const [arrivalTerminal, setArrivalTerminal] = useState("");
  const [greetingSign, setGreetingSign] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnPickupTime, setReturnPickupTime] = useState("");
  const [returnFlightNumber, setReturnFlightNumber] = useState("");
  const [returnTerminal, setReturnTerminal] = useState("");
  const [classImgFailed, setClassImgFailed] = useState(false);

  const legMultiplier = tripType === "ROUND_TRIP" ? 2 : 1;
  const totalPrice = useMemo(
    () => context.sellPrice * Math.max(1, numVehicles) * legMultiplier,
    [context.sellPrice, numVehicles, legMultiplier]
  );

  const totalCapacity = context.maxPax * Math.max(1, numVehicles);
  const capacityWarning = pax > totalCapacity;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerName.trim()) return setError("Customer name is required");
    if (!transferDate) return setError("Transfer date is required");

    startTransition(async () => {
      const result = await createTransferBooking({
        routeId: context.routeId,
        rateId: context.rateId,
        numVehicles: Math.max(1, numVehicles),
        transferDate,
        pickupTime: pickupTime || null,
        flightNumber: flightNumber || null,
        pax,
        luggageCount: luggageCount === "" ? null : Number(luggageCount),
        pickupAddress: pickupAddress || null,
        dropoffAddress: dropoffAddress || null,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        customerNationality: customerNationality || null,
        specialRequests: specialRequests || null,
        tripType,
        arrivalTerminal: arrivalTerminal || null,
        greetingSign: greetingSign || null,
        returnDate: tripType === "ROUND_TRIP" ? returnDate || null : null,
        returnPickupTime: tripType === "ROUND_TRIP" ? returnPickupTime || null : null,
        returnFlightNumber: tripType === "ROUND_TRIP" ? returnFlightNumber || null : null,
        returnTerminal: tripType === "ROUND_TRIP" ? returnTerminal || null : null,
      });
      if (result.success && result.bookingId) {
        router.push(`/transfers/booking/${result.bookingId}`);
      } else {
        setError(result.error || "Failed to create booking");
      }
    });
  }

  const vehicleLabel = VEHICLE_LABELS[context.vehicleType] ?? context.vehicleType;
  const cls = context.vehicleClass;
  const classDisplayName = cls?.name ?? vehicleLabel;
  const classMaxPax = cls?.maxPax ?? context.maxPax;
  const classMaxLuggage = cls?.maxLuggage ?? context.maxLuggage;
  const classAmenities = cls?.amenities ?? [];
  const fieldCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-trivia-200 focus:border-trivia-400";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="space-y-4 max-w-5xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Car className="w-4 h-4 text-trivia-500" /> Trip details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Transfer date <span className="text-red-500">*</span></label>
                <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Pickup time <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} disabled={isPending} className={fieldCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  <Plane className="w-3 h-3 inline mr-1" />Flight number <span className="text-slate-400 normal-case">(optional)</span>
                </label>
                <input type="text" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="e.g. MS 123" disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Passengers</label>
                <input type="number" min="1" value={pax} onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 1))} disabled={isPending} className={fieldCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Number of vehicles</label>
                <input type="number" min="1" value={numVehicles} onChange={(e) => setNumVehicles(Math.max(1, parseInt(e.target.value) || 1))} disabled={isPending} className={fieldCls} />
                {numVehicles === suggestedVehicles && (
                  <p className="text-[11px] text-slate-400 mt-1">Auto-suggested for {pax} pax</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Luggage count <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="number" min="0" value={luggageCount} onChange={(e) => setLuggageCount(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))} disabled={isPending} className={fieldCls} />
              </div>
            </div>

            {capacityWarning && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ {pax} passengers exceed capacity of {totalCapacity} ({numVehicles} × {context.maxPax}). Add more vehicles.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={labelCls}>Pickup address <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Hotel name / address" disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Drop-off address <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Hotel name / address" disabled={isPending} className={fieldCls} />
              </div>
            </div>

            {/* Arrival terminal + greeting sign */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Arrival terminal <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" value={arrivalTerminal} onChange={(e) => setArrivalTerminal(e.target.value)} placeholder="e.g. 1" disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Greeting sign <span className="text-slate-400 normal-case">(optional)</span></label>
                <input type="text" value={greetingSign} onChange={(e) => setGreetingSign(e.target.value)} placeholder="Name on the meet & greet board" disabled={isPending} className={fieldCls} />
              </div>
            </div>

            {/* Round trip toggle */}
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={tripType === "ROUND_TRIP"}
                onChange={(e) => setTripType(e.target.checked ? "ROUND_TRIP" : "ONE_WAY")}
                disabled={isPending}
                className="rounded"
              />
              Round trip <span className="text-xs text-slate-400 font-normal">(return journey — price ×2)</span>
            </label>

            {tripType === "ROUND_TRIP" && (
              <div className="rounded-xl border border-trivia-100 bg-trivia-50/40 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-trivia-700">Return journey ({context.toName} → {context.fromName})</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Return date</label>
                    <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} disabled={isPending} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Return pickup time</label>
                    <input type="time" value={returnPickupTime} onChange={(e) => setReturnPickupTime(e.target.value)} disabled={isPending} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Return flight no.</label>
                    <input type="text" value={returnFlightNumber} onChange={(e) => setReturnFlightNumber(e.target.value)} placeholder="e.g. MS 124" disabled={isPending} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Departure terminal</label>
                    <input type="text" value={returnTerminal} onChange={(e) => setReturnTerminal(e.target.value)} placeholder="e.g. 3" disabled={isPending} className={fieldCls} />
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-trivia-500" /> Customer
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <input type="text" value={customerNationality} onChange={(e) => setCustomerNationality(e.target.value)} disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} disabled={isPending} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={isPending} className={fieldCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Special requests <span className="text-slate-400 normal-case">(optional)</span></label>
              <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={2} disabled={isPending} className={fieldCls} />
            </div>
          </section>
        </form>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-4 space-y-4">
            <h2 className="font-semibold text-slate-900">Booking summary</h2>

            <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
              <MapPin className="w-4 h-4 text-trivia-500 flex-shrink-0" />
              <span className="truncate">{context.fromName}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{context.toName}</span>
            </div>

            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="w-16 h-12 flex-shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                {cls?.imageUrl && !classImgFailed ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={cls.imageUrl}
                    alt={classDisplayName}
                    className="w-full h-full object-cover"
                    onError={() => setClassImgFailed(true)}
                  />
                ) : (
                  <Car className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 text-sm">{classDisplayName}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">${context.sellPrice.toFixed(0)} / vehicle</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to {classMaxPax}</span>
                  {classMaxLuggage != null && (
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {classMaxLuggage} bags</span>
                  )}
                  {context.estimatedDurationMin && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{context.estimatedDurationMin}m</span>
                  )}
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

            <TransferInclusions compact />

            <div className="rounded-lg bg-amber-50 border border-amber-100 p-2.5 text-[11px] text-amber-800">
              <span className="font-semibold">Non-refundable</span> — this booking cannot be cancelled or modified (v1 policy).
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{numVehicles} × ${context.sellPrice.toFixed(0)}</span>
                <span>${(context.sellPrice * numVehicles).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-trivia-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-brand"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Creating…" : "Confirm booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
