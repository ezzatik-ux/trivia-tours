"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Info } from "lucide-react";
import { createRate, updateRate, type RateInput } from "./rates-actions";

type Supplier = {
  id: string;
  name: string;
};

type Rate = RateInput & {
  id: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  productId: string;
  suppliers: Supplier[];
  existingRate?: Rate | null;
};

export function RateFormModal({
  open,
  onClose,
  productId,
  suppliers,
  existingRate,
}: Props) {
  const isEditing = !!existingRate;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState(existingRate?.supplierId ?? "");
  const [netAdult, setNetAdult] = useState(existingRate?.netAdult?.toString() ?? "");
  const [netChild, setNetChild] = useState(existingRate?.netChild?.toString() ?? "");
  const [netInfant, setNetInfant] = useState(existingRate?.netInfant?.toString() ?? "0");
  const [markupPct, setMarkupPct] = useState(existingRate?.markupPct?.toString() ?? "20");
  const [minPax, setMinPax] = useState(existingRate?.minPax?.toString() ?? "1");
  const [maxPax, setMaxPax] = useState(existingRate?.maxPax?.toString() ?? "");
  const [childAgeMin, setChildAgeMin] = useState(existingRate?.childAgeMin?.toString() ?? "2");
  const [childAgeMax, setChildAgeMax] = useState(existingRate?.childAgeMax?.toString() ?? "11");
  const [validFrom, setValidFrom] = useState(
    existingRate?.validFrom ?? new Date().toISOString().split("T")[0]
  );
  const [validTo, setValidTo] = useState(
    existingRate?.validTo ??
      new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0]
  );
  const [isActive, setIsActive] = useState(existingRate?.isActive ?? true);

  // Calculate live preview of sell prices
  const previewSellAdult =
    netAdult && markupPct
      ? (parseFloat(netAdult) * (1 + parseFloat(markupPct) / 100)).toFixed(2)
      : "0.00";
  const previewSellChild =
    netChild && markupPct
      ? (parseFloat(netChild) * (1 + parseFloat(markupPct) / 100)).toFixed(2)
      : "0.00";
  const previewSellInfant =
    netInfant && markupPct
      ? (parseFloat(netInfant) * (1 + parseFloat(markupPct) / 100)).toFixed(2)
      : "0.00";

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: RateInput = {
      productId,
      supplierId: supplierId || null,
      netAdult: parseFloat(netAdult) || 0,
      netChild: parseFloat(netChild) || 0,
      netInfant: parseFloat(netInfant) || 0,
      markupPct: parseFloat(markupPct) || 0,
      minPax: minPax ? parseInt(minPax) : null,
      maxPax: maxPax ? parseInt(maxPax) : null,
      childAgeMin: childAgeMin ? parseInt(childAgeMin) : null,
      childAgeMax: childAgeMax ? parseInt(childAgeMax) : null,
      validFrom,
      validTo,
      isActive,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateRate(existingRate!.id, input)
        : await createRate(input);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditing ? "Edit Rate" : "Add New Rate"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Supplier
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              disabled={isPending}
              className="form-input bg-white"
            >
              <option value="">-- No specific supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Section */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Net Prices (USD) <span className="text-red-500">*</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Adult
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={netAdult}
                    onChange={(e) => setNetAdult(e.target.value)}
                    required
                    disabled={isPending}
                    className="form-input pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Child
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={netChild}
                    onChange={(e) => setNetChild(e.target.value)}
                    disabled={isPending}
                    className="form-input pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Infant
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={netInfant}
                    onChange={(e) => setNetInfant(e.target.value)}
                    disabled={isPending}
                    className="form-input pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Markup % <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(e.target.value)}
                  required
                  disabled={isPending}
                  className="form-input pr-8"
                  placeholder="20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-2">
                <Info className="w-3.5 h-3.5" />
                Sell Prices (auto-calculated)
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-emerald-700">Adult</p>
                  <p className="font-mono font-semibold text-emerald-900">
                    ${previewSellAdult}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">Child</p>
                  <p className="font-mono font-semibold text-emerald-900">
                    ${previewSellChild}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-emerald-700">Infant</p>
                  <p className="font-mono font-semibold text-emerald-900">
                    ${previewSellInfant}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pax & Age Rules */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Pax & Age Rules
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Min Pax
                </label>
                <input
                  type="number"
                  min="1"
                  value={minPax}
                  onChange={(e) => setMinPax(e.target.value)}
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Max Pax (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxPax}
                  onChange={(e) => setMaxPax(e.target.value)}
                  disabled={isPending}
                  className="form-input"
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Child Age Min
                </label>
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={childAgeMin}
                  onChange={(e) => setChildAgeMin(e.target.value)}
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Child Age Max
                </label>
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={childAgeMax}
                  onChange={(e) => setChildAgeMax(e.target.value)}
                  disabled={isPending}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Validity Period
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                  disabled={isPending}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
                  disabled={isPending}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-slate-300 focus:ring-2 focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">
                Active (available for booking)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
