"use client";

import { Check, Circle } from "lucide-react";

type Props = {
  currentStatus: string;
};

// Main pipeline (cancelled is handled separately)
const PIPELINE = [
  { status: "NEW", label: "New" },
  { status: "ACK", label: "Acknowledged" },
  { status: "HOTEL_CONTACTED", label: "Hotel Contacted" },
  { status: "AWAITING_INVOICE", label: "Awaiting Invoice" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "VOUCHER_ISSUED", label: "Voucher Issued" },
  { status: "CHECKED_IN", label: "Checked In" },
  { status: "CHECKED_OUT", label: "Checked Out" },
  { status: "COMPLETED", label: "Completed" },
];

export function StatusPipeline({ currentStatus }: Props) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
        <p className="text-red-800 font-semibold">⚠️ This booking has been cancelled</p>
      </div>
    );
  }

  const currentIdx = PIPELINE.findIndex((p) => p.status === currentStatus);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
      <div className="flex items-center min-w-max">
        {PIPELINE.map((step, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={step.status} className="flex items-center flex-shrink-0">
              {/* Step circle */}
              <div className="flex flex-col items-center w-20">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isCurrent
                      ? "bg-trivia-500 border-trivia-500 text-white shadow-brand"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Circle className="w-3 h-3 fill-current" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-[10px] uppercase tracking-wider font-semibold text-center leading-tight ${
                    isCurrent
                      ? "text-trivia-700"
                      : isComplete
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < PIPELINE.length - 1 && (
                <div
                  className={`h-0.5 w-8 -mt-6 transition-colors ${
                    isComplete ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
