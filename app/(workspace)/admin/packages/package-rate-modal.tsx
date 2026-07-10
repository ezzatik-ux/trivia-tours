"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, DollarSign } from "lucide-react";
import {
  createPackageRate,
  updatePackageRate,
  type PackageRateInput,
} from "./actions";

export type PackageRateRow = {
  id: string;
  label: string | null;
  netAdult: string;
  netChild: string;
  markupPct: string;
  sellAdult: string;
  sellChild: string;
  validFrom: string;
  validTo: string;
  minPax: number | null;
  maxPax: number | null;
  childAgeMin: number | null;
  childAgeMax: number | null;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  packageId: string;
  editing: PackageRateRow | null;
};

export function PackageRateModal({
  open,
  onClose,
  packageId,
  editing,
}: Props) {
  const router = useRouter();
  const isEdit = !!editing;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [netAdult, setNetAdult] = useState("");
  const [netChild, setNetChild] = useState("");
  const [markupPct, setMarkupPct] = useState("20");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [minPax, setMinPax] = useState("1");
  const [maxPax, setMaxPax] = useState("");
  const [childAgeMin, setChildAgeMin] = useState("2");
  const [childAgeMax, setChildAgeMax] = useState("11");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;

    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(
      new Date().setFullYear(new Date().getFullYear() + 1)
    )
      .toISOString()
      .split("T")[0];

    setLabel(editing?.label ?? "");
    setNetAdult(editing?.netAdult?.toString() ?? "");
    setNetChild(editing?.netChild?.toString() ?? "");
    setMarkupPct(editing?.markupPct?.toString() ?? "20");
    setValidFrom(editing?.validFrom ?? today);
    setValidTo(editing?.validTo ?? nextYear);
    setMinPax(editing?.minPax?.toString() ?? "1");
    setMaxPax(editing?.maxPax?.toString() ?? "");
    setChildAgeMin(editing?.childAgeMin?.toString() ?? "2");
    setChildAgeMax(editing?.childAgeMax?.toString() ?? "11");
    setIsActive(editing?.isActive ?? true);
    setError(null);
  }, [open, editing]);

  if (!open) return null;

  const previewSellAdult =
    netAdult && markupPct
      ? (parseFloat(netAdult) * (1 + parseFloat(markupPct) / 100)).toFixed(2)
      : "0.00";
  const previewSellChild =
    netChild && markupPct
      ? (parseFloat(netChild) * (1 + parseFloat(markupPct) / 100)).toFixed(2)
      : "0.00";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: PackageRateInput = {
      label: label || null,
      netAdult: parseFloat(netAdult) || 0,
      netChild: parseFloat(netChild) || 0,
      markupPct: parseFloat(markupPct) || 0,
      validFrom,
      validTo,
      minPax: parseInt(minPax, 10) || 1,
      maxPax: maxPax === "" ? null : parseInt(maxPax, 10),
      childAgeMin: parseInt(childAgeMin, 10) || 0,
      childAgeMax: parseInt(childAgeMax, 10) || 0,
      isActive: isEdit ? isActive : true,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updatePackageRate(editing!.id, payload)
        : await createPackageRate(packageId, payload);

      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error || "Failed");
      }
    });
  }

  const fieldCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-trivia-200 focus:border-trivia-400";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50">
      <div className="bg-white md:rounded-2xl rounded-t-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-trivia-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Rate" : "Add Rate"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Peak season, Standard"
              disabled={isPending}
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Net adult</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={netAdult}
                onChange={(e) => setNetAdult(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Net child</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={netChild}
                onChange={(e) => setNetChild(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Markup %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={markupPct}
                onChange={(e) => setMarkupPct(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="rounded-xl border border-trivia-100 bg-trivia-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-trivia-700 mb-1">
              Sell (auto)
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-800">
              <span>
                Adult <strong>${previewSellAdult}</strong>
              </span>
              <span>
                Child <strong>${previewSellChild}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Preview only — server recomputes on save.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Valid from</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                disabled={isPending}
                className={fieldCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Valid to</label>
              <input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                disabled={isPending}
                className={fieldCls}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Min pax</label>
              <input
                type="number"
                min="1"
                value={minPax}
                onChange={(e) => setMinPax(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max pax (optional)</label>
              <input
                type="number"
                min="1"
                value={maxPax}
                onChange={(e) => setMaxPax(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Child age min</label>
              <input
                type="number"
                min="0"
                value={childAgeMin}
                onChange={(e) => setChildAgeMin(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Child age max</label>
              <input
                type="number"
                min="0"
                value={childAgeMax}
                onChange={(e) => setChildAgeMax(e.target.value)}
                disabled={isPending}
                className={fieldCls}
              />
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
              />
              Active
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save" : "Add rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
