"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, FileText } from "lucide-react";
import { updateBookingMeta } from "./actions";

type Props = {
  bookingId: string;
  initialNotes: string | null;
};

export function InternalNotes({ bookingId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const result = await updateBookingMeta(bookingId, { internalNotes: notes });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900 text-sm">Internal Notes (Ops only)</h3>
      </div>

      <div className="p-5">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Add internal notes about this booking..."
          disabled={isPending}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm disabled:opacity-50 resize-none"
        />

        <div className="flex items-center justify-end gap-3 mt-3">
          {saved && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending || notes === (initialNotes ?? "")}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
