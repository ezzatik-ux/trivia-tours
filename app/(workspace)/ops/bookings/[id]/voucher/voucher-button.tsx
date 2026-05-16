"use client";

import { useState } from "react";
import { Download, Loader2, FileCheck, AlertTriangle } from "lucide-react";

type Props = {
  bookingId: string;
  bookingNo: string;
  bookingStatus: string;
};

export function VoucherButton({ bookingId, bookingNo, bookingStatus }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voucher is only useful from CONFIRMED status onwards
  const canGenerate = !["NEW", "ACK", "SUPPLIER_CONTACTED", "CANCELLED"].includes(
    bookingStatus
  );
  const isIssued = ["VOUCHER_ISSUED", "OPERATED", "CLOSED"].includes(bookingStatus);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      // Open in new tab — PDF streams from server
      const url = `/api/voucher/${bookingId}`;
      window.open(url, "_blank");

      // Wait a moment then refresh to update status badge if needed
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError("Failed to generate voucher");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900 text-sm">Voucher</h3>
      </div>

      <div className="p-5">
        {!canGenerate ? (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-medium mb-0.5">Voucher not available yet</p>
              <p>Booking must be Confirmed before generating voucher</p>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating
                ? "Generating..."
                : isIssued
                  ? "Regenerate Voucher"
                  : "Generate Voucher"}
            </button>

            {isIssued && (
              <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" />
                Voucher has been issued
              </p>
            )}

            {!isIssued && (
              <p className="text-xs text-slate-500 mt-2">
                Generating will automatically advance status to &quot;Voucher Issued&quot;
              </p>
            )}

            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
