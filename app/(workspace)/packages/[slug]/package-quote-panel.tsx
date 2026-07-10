"use client";

import { useState, useEffect, useTransition } from "react";
import { Calendar, Loader2, AlertCircle } from "lucide-react";
import { PaxCounter } from "@/components/ui/pax-counter";
import {
  calculatePackageQuote,
  type PackageQuoteCalculation,
} from "./actions";

type Props = {
  packageId: string;
};

export function PackageQuotePanel({ packageId }: Props) {
  const [isPending, startTransition] = useTransition();

  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split("T")[0];

  const [travelDate, setTravelDate] = useState(tomorrowIso);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [quote, setQuote] = useState<PackageQuoteCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!travelDate || adults < 1) {
      setQuote(null);
      setError(adults < 1 ? "At least 1 adult required." : null);
      return;
    }

    startTransition(async () => {
      const result = await calculatePackageQuote(
        packageId,
        travelDate,
        adults,
        children
      );
      if (result.success && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        setQuote(null);
        setError(result.error || "Unable to calculate quote");
      }
    });
  }, [packageId, travelDate, adults, children]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
          />
        </div>

        {/* Pax Counters — adults + children only (no infants) */}
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
            sublabel={
              quote?.childAgeMin != null && quote?.childAgeMax != null
                ? `Ages ${quote.childAgeMin}–${quote.childAgeMax}`
                : "Child rate"
            }
            value={children}
            onChange={setChildren}
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

            {quote.childAgeMin != null && quote.childAgeMax != null && (
              <p className="text-xs text-slate-500">
                Child price applies ages {quote.childAgeMin}–{quote.childAgeMax}
              </p>
            )}

            <div className="pt-3 mt-3 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-trivia-600 leading-none">
                  ${quote.totalPrice.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  USD · {quote.totalPax} pax
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isPending && !quote && !error && (
          <div className="flex items-center justify-center py-4 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Calculating...</span>
          </div>
        )}

        <p className="text-xs text-center text-slate-400">
          Quote based on current rates. Display only — no booking in this step.
        </p>
      </div>
    </div>
  );
}
