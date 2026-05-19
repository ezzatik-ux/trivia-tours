"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { createSeason, updateSeason, type SeasonInput } from "./seasons-actions";

type Season = SeasonInput & { id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  existing?: Season | null;
};

const PRESETS = [
  { label: "Low Season", priority: 0 },
  { label: "Mid Season", priority: 1 },
  { label: "High Season", priority: 2 },
  { label: "Peak Season", priority: 3 },
];

export function SeasonModal({ open, onClose, hotelId, existing }: Props) {
  const isEditing = !!existing;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existing?.name ?? "");
  const [validFrom, setValidFrom] = useState(
    existing?.validFrom ?? new Date().toISOString().split("T")[0]
  );
  const [validTo, setValidTo] = useState(
    existing?.validTo ??
      new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString()
        .split("T")[0]
  );
  const [surcharge, setSurcharge] = useState(existing?.surchargePerNight?.toString() ?? "0");
  const [priority, setPriority] = useState(existing?.priority ?? 1);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: SeasonInput = {
      hotelId,
      name,
      validFrom,
      validTo,
      surchargePerNight: parseFloat(surcharge) || 0,
      priority,
      isActive,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateSeason(existing!.id, input)
        : await createSeason(input);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  // Calculate number of nights in this season
  const nights =
    validFrom && validTo
      ? Math.ceil(
          (new Date(validTo).getTime() - new Date(validFrom).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-trivia-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditing ? "Edit Season" : "Add Season"}
            </h2>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Season name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Season Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Season Summer 2026"
              required
              disabled={isPending}
              className="form-input"
            />
            <p className="text-xs text-slate-500 mt-1">Internal name for this date range</p>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quick Tier Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPriority(p.priority)}
                  disabled={isPending}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border-2 transition-all ${
                    priority === p.priority
                      ? "border-trivia-500 bg-trivia-50 text-trivia-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Higher priority wins for overlapping date ranges
            </p>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                From <span className="text-red-500">*</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                To <span className="text-red-500">*</span>
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

          {nights > 0 && (
            <p className="text-xs text-slate-500 -mt-2">
              📅 Spans <span className="font-semibold text-slate-700">{nights} nights</span>
            </p>
          )}

          {/* Surcharge */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Surcharge Per Night (USD)
              <span className="text-slate-400 font-normal text-xs ml-2">optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={surcharge}
                onChange={(e) => setSurcharge(e.target.value)}
                step="0.01"
                min="0"
                disabled={isPending}
                className="form-input pl-7"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Added on top of base room rate during this season
            </p>
          </div>

          {/* Active toggle */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                Active (rates use this season)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              {isEditing ? "Save Changes" : "Create Season"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
