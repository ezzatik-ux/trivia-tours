"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  ChevronDown,
  Send,
  PhoneCall,
  FileCheck,
  Award,
  Flag,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { changeStatus } from "./actions";

type Status =
  | "NEW"
  | "ACK"
  | "SUPPLIER_CONTACTED"
  | "CONFIRMED"
  | "VOUCHER_ISSUED"
  | "OPERATED"
  | "CLOSED"
  | "CANCELLED";

const PIPELINE: Array<{ value: Status; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "NEW", label: "New", icon: Send },
  { value: "ACK", label: "Acknowledged", icon: PhoneCall },
  { value: "SUPPLIER_CONTACTED", label: "Supplier", icon: PhoneCall },
  { value: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { value: "VOUCHER_ISSUED", label: "Voucher", icon: FileCheck },
  { value: "OPERATED", label: "Operated", icon: Award },
  { value: "CLOSED", label: "Closed", icon: Flag },
];

type Props = {
  bookingId: string;
  currentStatus: Status;
};

export function StatusPipeline({ bookingId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCancelled = currentStatus === "CANCELLED";
  const currentIdx = PIPELINE.findIndex((s) => s.value === currentStatus);

  function handleChange(newStatus: Status, note?: string) {
    setError(null);
    setShowDropdown(false);
    startTransition(async () => {
      const result = await changeStatus(bookingId, newStatus, note);
      if (!result.success) {
        setError(result.error || "Something went wrong");
      }
    });
  }

  function handleCancel() {
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }
    handleChange("CANCELLED", cancelReason);
    setShowCancelDialog(false);
    setCancelReason("");
  }

  const nextStatuses = getNextStatuses(currentStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Status Pipeline</h2>

        {!isCancelled && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown((s) => !s)}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Change Status
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
                  {nextStatuses.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleChange(opt.value)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 text-sm transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <Icon className="w-4 h-4 text-slate-500" />
                        <div>
                          <div className="font-medium text-slate-900">{opt.label}</div>
                          {opt.description && (
                            <div className="text-xs text-slate-500">{opt.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowCancelDialog(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 text-sm transition-colors border-t border-slate-200"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    <div>
                      <div className="font-medium text-red-700">Cancel Booking</div>
                      <div className="text-xs text-red-600">Requires reason</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">This booking was cancelled</p>
              <p className="text-sm text-red-700 mt-0.5">
                See status history for cancellation reason
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-center min-w-fit gap-2">
              {PIPELINE.map((step, idx) => {
                const isComplete = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const Icon = step.icon;
                return (
                  <div key={step.value} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isComplete
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : isCurrent
                            ? "bg-blue-50 border-blue-500 text-blue-600 ring-4 ring-blue-100"
                            : "bg-white border-slate-300 text-slate-300"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrent ? (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center font-medium ${
                          isCurrent
                            ? "text-slate-900"
                            : isComplete
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>

                    {idx < PIPELINE.length - 1 && (
                      <div
                        className={`h-0.5 w-8 mt-[-22px] ${
                          isComplete ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cancel Booking?</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  This action will be logged and the sales agent will be notified.
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="e.g., Customer requested cancellation due to schedule change..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending || !cancelReason.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getNextStatuses(current: Status): Array<{
  value: Status;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}> {
  const transitions: Record<Status, Array<{ value: Status; label: string; description?: string; icon: React.ComponentType<{ className?: string }> }>> = {
    NEW: [
      { value: "ACK", label: "Acknowledge", description: "Start processing", icon: PhoneCall },
    ],
    ACK: [
      { value: "SUPPLIER_CONTACTED", label: "Contacted Supplier", description: "Awaiting confirmation", icon: PhoneCall },
      { value: "CONFIRMED", label: "Confirmed", description: "Skip to confirmed", icon: CheckCircle2 },
    ],
    SUPPLIER_CONTACTED: [
      { value: "CONFIRMED", label: "Confirmed", description: "Supplier confirmed", icon: CheckCircle2 },
    ],
    CONFIRMED: [
      { value: "VOUCHER_ISSUED", label: "Voucher Issued", description: "Voucher sent to customer", icon: FileCheck },
    ],
    VOUCHER_ISSUED: [
      { value: "OPERATED", label: "Operated", description: "Service delivered", icon: Award },
    ],
    OPERATED: [
      { value: "CLOSED", label: "Closed", description: "Final closure", icon: Flag },
    ],
    CLOSED: [],
    CANCELLED: [],
  };

  return transitions[current] || [];
}
