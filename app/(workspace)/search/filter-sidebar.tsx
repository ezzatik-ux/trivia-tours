"use client";

import { Compass, MapPin, Activity, Car, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductType = "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";

const TYPE_OPTIONS: Array<{
  value: ProductType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "TOUR", label: "Tours", icon: Compass },
  { value: "EXCURSION", label: "Excursions", icon: MapPin },
  { value: "ACTIVITY", label: "Activities", icon: Activity },
  { value: "TRANSFER", label: "Transfers", icon: Car },
];

const DURATION_PRESETS = [
  { label: "Under 2 hours", min: 0, max: 2 },
  { label: "2–4 hours", min: 2, max: 4 },
  { label: "4–8 hours", min: 4, max: 8 },
  { label: "Full day (8+ hrs)", min: 8, max: null },
];

type Props = {
  selectedTypes: ProductType[];
  onTypeToggle: (type: ProductType) => void;
  durationRange: { min: number | null; max: number | null };
  onDurationChange: (min: number | null, max: number | null) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onClearAll: () => void;
  resultCount: number;
};

export function FilterSidebar({
  selectedTypes,
  onTypeToggle,
  durationRange,
  onDurationChange,
  search,
  onSearchChange,
  onClearAll,
  resultCount,
}: Props) {
  const hasFilters =
    selectedTypes.length > 0 ||
    durationRange.min != null ||
    durationRange.max != null ||
    !!search;

  function isDurationPresetActive(preset: typeof DURATION_PRESETS[0]) {
    return durationRange.min === preset.min && durationRange.max === preset.max;
  }

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="md:sticky md:top-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Filters</h2>
          {hasFilters && (
            <button
              onClick={onClearAll}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Product name..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Product Type
          </p>
          <div className="space-y-1.5">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => onTypeToggle(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Duration
          </p>
          <div className="space-y-1.5">
            {DURATION_PRESETS.map((preset) => {
              const isActive = isDurationPresetActive(preset);
              return (
                <button
                  key={preset.label}
                  onClick={() =>
                    isActive
                      ? onDurationChange(null, null)
                      : onDurationChange(preset.min, preset.max)
                  }
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{resultCount}</span>{" "}
            {resultCount === 1 ? "product" : "products"}
          </p>
        </div>
      </div>
    </aside>
  );
}
