"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, User, Phone, Mail, MapPin, Clock, FileText } from "lucide-react";
import { createBooking, type CreateBookingInput } from "../actions";

type QuoteData = {
  productId: string;
  rateId: string;
  travelDate: string;
  adults: number;
  children: number;
  infants: number;
  unitAdult: number;
  unitChild: number;
  unitInfant: number;
  totalPrice: number;
};

type ProductInfo = {
  name: string;
  type: string;
  countryName: string | null;
  countryFlag: string | null;
};

type Props = {
  quote: QuoteData;
  product: ProductInfo;
};

export function BookingForm({ quote, product }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [salesOrderNo, setSalesOrderNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCountry, setCustomerCountry] = useState("");
  const [customerNationality, setCustomerNationality] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const totalPax = quote.adults + quote.children + quote.infants;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: CreateBookingInput = {
      ...quote,
      salesOrderNo,
      customerName,
      customerEmail: customerEmail || undefined,
      customerPhone: customerPhone || undefined,
      customerCountry: customerCountry || undefined,
      customerNationality: customerNationality || undefined,
      pickupTime: pickupTime || undefined,
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      specialRequests: specialRequests || undefined,
      internalNotes: internalNotes || undefined,
    };

    startTransition(async () => {
      const result = await createBooking(input);

      if (result.success && result.bookingId) {
        router.push(`/bookings/${result.bookingId}?created=1`);
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Form sections */}
      <div className="lg:col-span-2 space-y-5">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Sales Order Reference */}
        <FormSection
          title="Booking Reference"
          description="Link this booking to your existing sales order"
        >
          <Label required>Sales Order #</Label>
          <input
            type="text"
            value={salesOrderNo}
            onChange={(e) => setSalesOrderNo(e.target.value)}
            placeholder="e.g., SO-2026-04823"
            required
            disabled={isPending}
            className="form-input font-mono"
          />
        </FormSection>

        {/* Customer Details */}
        <FormSection title="Customer Details" description="Lead passenger information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label required>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  required
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+20 100 123 4567"
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div>
              <Label>Country of Residence</Label>
              <input
                type="text"
                value={customerCountry}
                onChange={(e) => setCustomerCountry(e.target.value)}
                placeholder="e.g., United States"
                disabled={isPending}
                className="form-input"
              />
            </div>

            <div>
              <Label>Nationality</Label>
              <input
                type="text"
                value={customerNationality}
                onChange={(e) => setCustomerNationality(e.target.value)}
                placeholder="e.g., American"
                disabled={isPending}
                className="form-input"
              />
            </div>
          </div>
        </FormSection>

        {/* Pickup Details */}
        <FormSection title="Pickup Details" description="Where and when to collect the customer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pickup Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div /> {/* Spacer */}

            <div className="md:col-span-2">
              <Label>Pickup Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Hotel name + address"
                  disabled={isPending}
                  className="form-input pl-9"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Dropoff Location</Label>
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                placeholder="Same as pickup, or different address"
                disabled={isPending}
                className="form-input"
              />
            </div>
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Additional Information" description="Optional notes for the team">
          <div className="space-y-4">
            <div>
              <Label>Special Requests (from customer)</Label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g., Vegetarian meals, wheelchair accessible..."
                disabled={isPending}
                rows={3}
                className="form-input resize-none"
              />
            </div>

            <div>
              <Label>Internal Notes (for Ops team)</Label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notes only visible to operations team..."
                disabled={isPending}
                rows={3}
                className="form-input resize-none"
              />
            </div>
          </div>
        </FormSection>
      </div>

      {/* RIGHT: Sticky quote summary */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24 space-y-4">
          {/* Quote Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Booking Summary
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Product */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">
                  Product
                </p>
                <p className="font-semibold text-slate-900">{product.name}</p>
                {product.countryName && (
                  <p className="text-sm text-slate-600 mt-0.5">
                    {product.countryFlag} {product.countryName}
                  </p>
                )}
              </div>

              {/* Travel Date */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">
                  Travel Date
                </p>
                <p className="font-medium text-slate-900">
                  {new Date(quote.travelDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Pax */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">
                  Passengers
                </p>
                <p className="font-medium text-slate-900">
                  {totalPax} total · {quote.adults} adult{quote.adults !== 1 ? "s" : ""}
                  {quote.children > 0 && `, ${quote.children} child${quote.children !== 1 ? "ren" : ""}`}
                  {quote.infants > 0 && `, ${quote.infants} infant${quote.infants !== 1 ? "s" : ""}`}
                </p>
              </div>

              {/* Price breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-sm">
                {quote.adults > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">{quote.adults} × Adult</span>
                    <span className="text-slate-900 font-medium">
                      ${(quote.adults * quote.unitAdult).toFixed(2)}
                    </span>
                  </div>
                )}
                {quote.children > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">{quote.children} × Child</span>
                    <span className="text-slate-900 font-medium">
                      ${(quote.children * quote.unitChild).toFixed(2)}
                    </span>
                  </div>
                )}
                {quote.infants > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">{quote.infants} × Infant</span>
                    <span className="text-slate-900 font-medium">
                      ${(quote.infants * quote.unitInfant).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <p className="text-2xl font-bold text-slate-900">
                  ${quote.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Creating Booking..." : "Confirm & Create Booking"}
          </button>

          <p className="text-xs text-center text-slate-400">
            Booking will be sent to Operations for confirmation
          </p>
        </div>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}
