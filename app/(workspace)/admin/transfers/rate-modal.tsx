"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { X, Loader2, DollarSign, Sparkles } from "lucide-react";
import {
  createRate,
  updateRate,
  type VehicleType,
} from "./actions";

type Rate = {
  id: string;
  routeId: string;
  vehicleType: VehicleType;
  maxPax: number;
  maxLuggage: number | null;
  netPrice: string;
  markupPct: string | null;
  sellPrice: string;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  routeId: string;
  existing?: Rate | null;
};

const VEHICLE_TYPES: { value: VehicleType; label: string; defaultPax: number }[] = [
  { value: "SEDAN", label: "Sedan", defaultPax: 3 },
  { value: "SUV", label: "SUV", defaultPax: 4 },
  { value: "VAN", label: "Van", defaultPax: 8 },
  { value: "MINIBUS", label: "Minibus", defaultPax: 14 },
  { value: "COACH", label: "Coach", defaultPax: 45 },
];

function calcSell(net: number, markup: number) {
  return (net * (1 + markup / 100)).toFixed(2);
}

export function TransferRateModal({ open, onClose, routeId, existing }: Props) {
  const isEditing = !!existing;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [vehicleType, setVehicleType] = useState<VehicleType>(existing?.vehicleType ?? "SEDAN");
  const [maxPax, setMaxPax] = useState(existing?.maxPax?.toString() ?? "3");
  const [maxLuggage, setMaxLuggage] = useState(existing?.maxLuggage?.toString() ?? "");
  const [netPrice, setNetPrice] = useState(existing?.netPrice ?? "");
  const [markupPct, setMarkupPct] = useState(existing?.markupPct ?? "25");
  const [sellOverride, setSellOverride] = useState(false);
  const [sellPrice, setSellPrice] = useState(existing?.sellPrice ?? "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  const autoSell = useMemo(() => {
    const net = parseFloat(netPrice) || 0;
    const markup = parseFloat(markupPct) || 0;
    return calcSell(net, markup);
  }, [netPrice, markupPct]);

  useEffect(() => {
    if (!sellOverride) {
      setSellPrice(autoSell);
    }
  }, [autoSell, sellOverride]);

  useEffect(() => {
    if (open && existing) {
      const auto = calcSell(
        parseFloat(existing.netPrice) || 0,
        parseFloat(existing.markupPct ?? "0") || 0
      );
      setSellOverride(existing.sellPrice !== auto);
    }
  }, [open, existing]);

  function handleVehicleChange(type: VehicleType) {
    setVehicleType(type);
    const def = VEHICLE_TYPES.find((v) => v.value === type);
    if (def && !isEditing) setMaxPax(def.defaultPax.toString());
  }

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const net = parseFloat(netPrice);
    const markup = parseFloat(markupPct) || 0;
    const sell = parseFloat(sellPrice);
    const pax = parseInt(maxPax, 10);

    if (!net || net <= 0) {
      setError("Net price must be greater than 0");
      return;
    }
    if (!pax || pax < 1) {
      setError("Max passengers must be at least 1");
      return;
    }
    if (!sell || sell <= 0) {
      setError("Sell price must be greater than 0");
      return;
    }

    const input = {
      routeId,
      vehicleType,
      maxPax: pax,
      maxLuggage: maxLuggage ? parseInt(maxLuggage, 10) : null,
      netPrice: net,
      markupPct: markup,
      sellPrice: sell,
      isActive,
    };

    startTransition(async () => {
      if (isEditing) {
        const result = await updateRate(existing!.id, input);
        if (result.success) onClose();
        else setError(result.error || "Something went wrong");
      } else {
        const { isActive: _, ...createInput } = input;
        const result = await createRate(createInput);
        if (result.success) onClose();
        else setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-trivia-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditing ? "Edit Rate" : "Add Vehicle Rate"}
            </h2>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Vehicle Type <span className="text-red-500">*</span>
            </label>
            <select
              value={vehicleType}
              onChange={(e) => handleVehicleChange(e.target.value as VehicleType)}
              className="form-input bg-white"
              disabled={isPending}
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Max Passengers <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={maxPax}
                onChange={(e) => setMaxPax(e.target.value)}
                min="1"
                className="form-input"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Luggage</label>
              <input
                type="number"
                value={maxLuggage}
                onChange={(e) => setMaxLuggage(e.target.value)}
                min="0"
                placeholder="Optional"
                className="form-input"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Net Price (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={netPrice}
                  onChange={(e) => setNetPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  className="form-input pl-7"
                  disabled={isPending}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Markup %</label>
              <div className="relative">
                <input
                  type="number"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(e.target.value)}
                  step="0.1"
                  min="0"
                  className="form-input pr-8"
                  disabled={isPending}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5" />
                Sell Price {sellOverride ? "(manual override)" : "(auto-calculated)"}
              </div>
              <label className="flex items-center gap-2 text-xs text-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sellOverride}
                  onChange={(e) => {
                    setSellOverride(e.target.checked);
                    if (!e.target.checked) setSellPrice(autoSell);
                  }}
                  disabled={isPending}
                  className="w-3.5 h-3.5 rounded border-emerald-300"
                />
                Override
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm">$</span>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => {
                  setSellPrice(e.target.value);
                  setSellOverride(true);
                }}
                readOnly={!sellOverride}
                step="0.01"
                min="0"
                className={`form-input pl-7 font-mono font-bold ${
                  sellOverride ? "bg-white" : "bg-emerald-50/50 text-emerald-900"
                }`}
                disabled={isPending}
              />
            </div>
            {!sellOverride && (
              <p className="text-[10px] text-emerald-700 mt-1.5">
                ${netPrice || "0"} × (1 + {markupPct || "0"}%) = ${autoSell}
              </p>
            )}
          </div>

          {isEditing && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="px-5 py-2 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save" : "Add Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
