"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Check, Hash, FileText } from "lucide-react";
import { saveHotelConfirmationRef, saveInvoiceNumber, saveInternalNotes } from "../../hotel-queue/actions";

type Props = {
  bookingId: string;
  hotelConfirmationRef: string | null;
  invoiceNoOdoo: string | null;
  internalNotes: string | null;
};

export function ConfirmationRefs({
  bookingId,
  hotelConfirmationRef,
  invoiceNoOdoo,
  internalNotes,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RefField
          icon={Hash}
          label="Hotel Confirmation Reference"
          placeholder="e.g., OBR-2026-5678"
          helpText="From hotel's confirmation email"
          initialValue={hotelConfirmationRef}
          onSave={(value) => saveHotelConfirmationRef(bookingId, value)}
        />
        <RefField
          icon={FileText}
          label="Odoo Invoice Number"
          placeholder="e.g., INV/2026/0123"
          helpText="Sales adds this for accounting"
          initialValue={invoiceNoOdoo}
          onSave={(value) => saveInvoiceNumber(bookingId, value)}
        />
      </div>

      <NotesField
        bookingId={bookingId}
        initialValue={internalNotes}
      />
    </div>
  );
}

// ─── Reusable ref input field ────────────────

type FieldProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
  helpText?: string;
  initialValue: string | null;
  onSave: (value: string) => Promise<{ success: boolean; error?: string }>;
};

function RefField({ icon: Icon, label, placeholder, helpText, initialValue, onSave }: FieldProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const hasChanges = value !== (initialValue ?? "");

  function handleSave() {
    if (!hasChanges) return;
    startTransition(async () => {
      const result = await onSave(value);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isPending}
          className="form-input font-mono text-sm"
        />
        <button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className="px-3 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      {helpText && <p className="text-xs text-slate-500 mt-1.5">{helpText}</p>}
    </div>
  );
}

// ─── Internal notes ──────────────────────────

function NotesField({ bookingId, initialValue }: { bookingId: string; initialValue: string | null }) {
  const [value, setValue] = useState(initialValue ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const hasChanges = value !== (initialValue ?? "");

  function handleSave() {
    if (!hasChanges) return;
    startTransition(async () => {
      const result = await saveInternalNotes(bookingId, value);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <FileText className="w-3.5 h-3.5" />
          Internal Notes (Ops only)
        </label>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isPending}
          className="px-3 py-1.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-3 h-3" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-3 h-3" />
              Save
            </>
          )}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add notes for the Ops team (customer asked about extra services, hotel mentioned VIP status, etc.)"
        rows={3}
        disabled={isPending}
        className="form-input resize-none text-sm"
      />
      <p className="text-xs text-slate-500 mt-1.5">
        Visible to Ops and Admin only. Not shared with customer or sales agent.
      </p>
    </div>
  );
}
