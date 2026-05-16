"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { PaxCounter } from "@/components/ui/pax-counter";
import { calculateQuote, type QuoteCalculation } from "../../actions";

type Props = {
  productId: string;
  productName: string;
};

export function QuotePanel({ productId, productName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split("T")[0];

  const [travelDate, setTravelDate] = useState(tomorrowIso);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const [quote, setQuote] = useState<QuoteCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Re-calculate quote whenever inputs change
  useEffect(() => {
    if (!travelDate || adults < 1) {
      setQuote(null);
      setError(null);
      return;
    }

    startTransition(async () => {
      const result = await calculateQuote(productId, travelDate, adults, children, infants);
      if (result.success && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        setQuote(null);
        setError(result.error || "Unable to calculate quote");
      }
    });
  }, [productId, travelDate, adults, children, infants]);

  function handleProceedToBooking() {
    if (!quote) return;

    // Pass quote data to booking page via query params
    const params = new URLSearchParams({
      productId,
      rateId: quote.rateId,
      travelDate,
      adults: adults.toString(),
      children: children.toString(),
      infants: infants.toString(),
      unitAdult: quote.unitAdult.toString(),
      unitChild: quote.unitChild.toString(),
      unitInfant: quote.unitInfant.toString(),
      totalPrice: quote.totalPrice.toString(),
    });

    router.push(`/bookings/new?${params.toString()}`);
  }

  const totalPax = adults + children + infants;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Build a Quote
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Travel Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            <Calendar className="inline w-4 h-4 mr-1" />
            Travel Date
          </label>
          <input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={tomorrowIso}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        {/* Pax Counters */}
        <div className="border-y border-slate-100 divide-y divide-slate-100">
          <PaxCounter
            label="Adults"
            sublabel="Age 12+"
            value={adults}
            onChange={setAdults}
            min={1}
            disabled={isPending}
          />
          <PaxCounter
            label="Children"
            sublabel="Age 2–11"
            value={children}
            onChange={setChildren}
            min={0}
            disabled={isPending}
          />
          <PaxCounter
            label="Infants"
            sublabel="Under 2"
            value={infants}
            onChange={setInfants}
            min={0}
            disabled={isPending}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">{error}</p>
          </div>
        )}

        {/* Quote breakdown */}
        {quote && !error && (
          <div className="space-y-2 pt-2">
            {adults > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {adults} × Adult @ ${quote.unitAdult.toFixed(2)}
                </span>
                <span className="font-medium text-slate-900">
                  ${(adults * quote.unitAdult).toFixed(2)}
                </span>
              </div>
            )}
            {children > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {children} × Child @ ${quote.unitChild.toFixed(2)}
                </span>
                <span className="font-medium text-slate-900">
                  ${(children * quote.unitChild).toFixed(2)}
                </span>
              </div>
            )}
            {infants > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {infants} × Infant @ ${quote.unitInfant.toFixed(2)}
                </span>
                <span className="font-medium text-slate-900">
                  ${(infants * quote.unitInfant).toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="pt-3 mt-3 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 leading-none">
                  ${quote.totalPrice.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">USD · {totalPax} pax</p>
              </div>
            </div>

            {quote.supplierName && (
              <p className="text-xs text-slate-400 italic">
                Supplied by {quote.supplierName}
              </p>
            )}
          </div>
        )}

        {/* Loading state */}
        {isPending && !quote && !error && (
          <div className="flex items-center justify-center py-4 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Calculating...</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleProceedToBooking}
          disabled={!quote || isPending || !!error}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Booking
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-center text-slate-400">
          Quote based on current rates. Final price confirmed at booking.
        </p>
      </div>
    </div>
  );
}
