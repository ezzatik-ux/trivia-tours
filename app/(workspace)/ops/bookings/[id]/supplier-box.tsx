"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, Building2 } from "lucide-react";
import { updateBookingMeta } from "./actions";

type Props = {
  bookingId: string;
  initialSupplierRef: string | null;
  supplierName: string | null;
};

export function SupplierBox({ bookingId, initialSupplierRef, supplierName }: Props) {
  const [supplierRef, setSupplierRef] = useState(initialSupplierRef ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const result = await updateBookingMeta(bookingId, { supplierRef });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900 text-sm">Supplier Coordination</h3>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">
            Supplier
          </p>
          <p className="font-medium text-slate-900">
            {supplierName || <span className="text-slate-400 italic">No supplier assigned</span>}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Supplier Confirmation Reference
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={supplierRef}
              onChange={(e) => setSupplierRef(e.target.value)}
              placeholder="e.g., REF-2026-04823"
              disabled={isPending}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm disabled:opacity-50 font-mono"
            />
            <button
              onClick={handleSave}
              disabled={isPending || supplierRef === (initialSupplierRef ?? "")}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : null}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reference number from supplier&apos;s confirmation
          </p>
        </div>
      </div>
    </div>
  );
}
