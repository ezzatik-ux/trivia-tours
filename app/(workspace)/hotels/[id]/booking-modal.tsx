"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, User, Mail, Phone, Globe, MessageSquare, Hotel } from "lucide-react";
import { createHotelBooking } from "../actions";

type RoomData = {
  id: string;
  name: string;
  maxOccupancy: number;
  rate: {
    id: string;
    netDouble: string;
    sellSingle: string | null;
    sellDouble: string | null;
    sellTriple: string | null;
    sellQuad: string | null;
    mealPlan: "RO" | "BB" | "HB" | "FB" | "AI";
    childAgeMin: number | null;
    childAgeMax: number | null;
    childRate: string | null;
  } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
  room: RoomData;
  checkIn: string;
  checkOut: string;
  nights: number;
  pax: number;
};

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

export function BookingModal({
  open,
  onClose,
  hotelId,
  hotelName,
  room,
  checkIn,
  checkOut,
  nights,
  pax,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Occupancy auto-select based on pax
  const initialOccupancy: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" =
    pax === 1 ? "SINGLE" : pax === 3 ? "TRIPLE" : pax >= 4 ? "QUAD" : "DOUBLE";

  const [occupancy, setOccupancy] = useState<"SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD">(initialOccupancy);
  const [numRooms, setNumRooms] = useState(1);
  const [adults, setAdults] = useState(pax);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNationality, setCustomerNationality] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const pricing = useMemo(() => {
    if (!room.rate) return { unitRate: 0, total: 0, childSupp: 0 };

    const rates = {
      SINGLE: Number(room.rate.sellSingle ?? 0),
      DOUBLE: Number(room.rate.sellDouble ?? 0),
      TRIPLE: Number(room.rate.sellTriple ?? 0),
      QUAD: Number(room.rate.sellQuad ?? 0),
    };

    const unitRate = rates[occupancy];
    const childSupp = (Number(room.rate.childRate ?? 0)) * children * nights;
    const roomTotal = unitRate * nights * numRooms;
    const total = roomTotal + childSupp;

    // Net cost (for ops)
    const netDouble = Number(room.rate.netDouble ?? 0);
    const netCost = netDouble * nights * numRooms;

    return { unitRate, total, childSupp, netCost };
  }, [room.rate, occupancy, nights, numRooms, children]);

  if (!open || !room.rate) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!room.rate) {
      setError("Rate not available");
      return;
    }

    startTransition(async () => {
      const result = await createHotelBooking({
        hotelId,
        roomTypeId: room.id,
        rateId: room.rate!.id,
        checkIn,
        checkOut,
        nights,
        numRooms,
        occupancy,
        adults,
        children,
        infants,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        customerNationality: customerNationality || null,
        unitRate: pricing.unitRate,
        childSupplements: pricing.childSupp,
        totalPrice: pricing.total,
        netCost: pricing.netCost ?? 0,
        specialRequests: specialRequests || null,
      });

      if (result.success && "bookingId" in result && result.bookingId) {
        router.push(`/hotels/booking/${result.bookingId}`);
      } else {
        setError(result.error || "Failed to create booking");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50">
      <div className="bg-white md:rounded-2xl rounded-t-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-trivia-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Book {room.name}</h2>
              <p className="text-xs text-slate-500">{hotelName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* === ROOM & OCCUPANCY === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Occupancy</label>
              <div className="grid grid-cols-4 gap-1">
                {(["SINGLE", "DOUBLE", "TRIPLE", "QUAD"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOccupancy(o)}
                    disabled={isPending}
                    className={`px-1 py-2 text-xs font-medium rounded-lg border-2 ${
                      occupancy === o
                        ? "border-trivia-500 bg-trivia-50 text-trivia-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {o[0] + o.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Number of Rooms</label>
              <input
                type="number"
                value={numRooms}
                onChange={(e) => setNumRooms(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="10"
                disabled={isPending}
                className="form-input"
              />
            </div>
          </div>

          {/* === GUESTS === */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Adults</label>
              <input
                type="number"
                value={adults}
                onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                disabled={isPending}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Children (
                {room.rate.childAgeMin ?? 2}-{room.rate.childAgeMax ?? 11} yrs)
              </label>
              <input
                type="number"
                value={children}
                onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                disabled={isPending}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Infants</label>
              <input
                type="number"
                value={infants}
                onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                disabled={isPending}
                className="form-input"
              />
            </div>
          </div>

          {/* === CUSTOMER === */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Customer details</h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="As on passport"
                  required
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                    disabled={isPending}
                    className="form-input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+20 100 ..."
                    disabled={isPending}
                    className="form-input pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nationality</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerNationality}
                  onChange={(e) => setCustomerNationality(e.target.value)}
                  placeholder="e.g., Egyptian"
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Special requests</label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g., Late check-in, dietary requirements, accessibility..."
                  rows={3}
                  disabled={isPending}
                  className="form-input pl-9 resize-none"
                />
              </div>
            </div>
          </div>

          {/* === PRICE SUMMARY === */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                ${pricing.unitRate.toFixed(2)} × {nights} {nights === 1 ? "night" : "nights"} × {numRooms}{" "}
                {numRooms === 1 ? "room" : "rooms"}
              </span>
              <span className="font-medium text-slate-900">
                ${(pricing.unitRate * nights * numRooms).toFixed(2)}
              </span>
            </div>
            {pricing.childSupp > 0 && (
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Child supplement ({children} × {nights} nights)</span>
                <span className="font-medium text-slate-900">${pricing.childSupp.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-2xl font-bold text-trivia-600">${pricing.total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Meal plan: {MEAL_PLAN_LABELS[room.rate.mealPlan]}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white -mx-6 px-6 py-4 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Booking · ${pricing.total.toFixed(0)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
