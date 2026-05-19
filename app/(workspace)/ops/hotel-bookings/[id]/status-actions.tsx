"use client";

import { useState, useTransition } from "react";
import { Loader2, ArrowRight, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { changeHotelBookingStatus, type HotelBookingStatus } from "../../hotel-queue/actions";

type Props = {
  bookingId: string;
  currentStatus: string;
};

// Define what transitions are allowed from each status
const NEXT_ACTIONS: Record<string, { status: HotelBookingStatus; label: string; primary?: boolean }[]> = {
  NEW: [
    { status: "ACK", label: "Acknowledge", primary: true },
    { status: "CANCELLED", label: "Cancel" },
  ],
  ACK: [
    { status: "HOTEL_CONTACTED", label: "Mark Hotel Contacted", primary: true },
    { status: "CANCELLED", label: "Cancel" },
  ],
  HOTEL_CONTACTED: [
    { status: "AWAITING_INVOICE", label: "Awaiting Invoice", primary: true },
    { status: "CONFIRMED", label: "Skip to Confirmed" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  AWAITING_INVOICE: [
    { status: "CONFIRMED", label: "Confirm Booking", primary: true },
    { status: "CANCELLED", label: "Cancel" },
  ],
  CONFIRMED: [
    { status: "VOUCHER_ISSUED", label: "Issue Voucher", primary: true },
    { status: "CANCELLED", label: "Cancel" },
  ],
  VOUCHER_ISSUED: [
    { status: "CHECKED_IN", label: "Mark Checked In", primary: true },
  ],
  CHECKED_IN: [
    { status: "CHECKED_OUT", label: "Mark Checked Out", primary: true },
  ],
  CHECKED_OUT: [
    { status: "COMPLETED", label: "Complete Booking", primary: true },
  ],
};

export function StatusActions({ bookingId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmingStatus, setConfirmingStatus] = useState<HotelBookingStatus | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[currentStatus] ?? [];

  if (actions.length === 0 || currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="font-medium text-slate-900">
          {currentStatus === "COMPLETED"
            ? "This booking is complete"
            : "This booking is cancelled"}
        </p>
        <p className="text-sm text-slate-500 mt-1">No further actions available</p>
      </div>
    );
  }

  function handleClick(status: HotelBookingStatus) {
    setConfirmingStatus(status);
    setNote("");
    setError(null);
  }

  function handleConfirm() {
    if (!confirmingStatus) return;

    startTransition(async () => {
      const result = await changeHotelBookingStatus(bookingId, confirmingStatus, note);
      if (result.success) {
        setConfirmingStatus(null);
        setNote("");
      } else {
        setError(result.error || "Failed to change status");
      }
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>

      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.status}
            onClick={() => handleClick(a.status)}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
              a.status === "CANCELLED"
                ? "border border-red-200 text-red-700 hover:bg-red-50"
                : a.primary
                ? "bg-trivia-500 hover:bg-trivia-600 text-white shadow-sm"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {a.label}
            {a.status !== "CANCELLED" && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>

      {/* Confirmation modal */}
      {confirmingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">
                {confirmingStatus === "CANCELLED" ? "Cancel booking?" : "Change status?"}
              </h3>
              <button onClick={() => setConfirmingStatus(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              {confirmingStatus === "CANCELLED" ? (
                <>
                  <AlertCircle className="inline w-4 h-4 text-amber-500 mr-1" />
                  This will mark the booking as cancelled. Customer should be notified.
                </>
              ) : (
                <>
                  Set status to{" "}
                  <span className="font-semibold text-slate-900">
                    {confirmingStatus.replace(/_/g, " ")}
                  </span>
                  ?
                </>
              )}
            </p>

            {error && (
              <div className="p-2 mb-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {error}
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (will appear in history)..."
              rows={2}
              disabled={isPending}
              className="form-input resize-none mb-4 text-sm"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmingStatus(null)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                  confirmingStatus === "CANCELLED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-trivia-500 hover:bg-trivia-600"
                }`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
