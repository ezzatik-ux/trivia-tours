"use client";

import { Star, X } from "lucide-react";

type Props = {
  // Star ratings
  selectedStars: number[];
  onStarToggle: (star: number) => void;

  // Amenities
  allAmenities: string[];
  selectedAmenities: string[];
  onAmenityToggle: (a: string) => void;

  // Price range
  minPrice: number;
  maxPrice: number;
  priceMin: number;
  priceMax: number;
  onPriceChange: (min: number, max: number) => void;

  // Clear all
  onClearAll: () => void;
  hasActiveFilters: boolean;
};

export function HotelFilters({
  selectedStars,
  onStarToggle,
  allAmenities,
  selectedAmenities,
  onAmenityToggle,
  minPrice,
  maxPrice,
  priceMin,
  priceMax,
  onPriceChange,
  onClearAll,
  hasActiveFilters,
}: Props) {
  return (
    <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Filter results</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-trivia-600 hover:underline font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Star Rating */}
      <FilterGroup title="Star Rating">
        <div className="space-y-1.5">
          {[5, 4, 3].map((star) => (
            <label
              key={star}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 px-2 py-1.5 -mx-2 rounded-lg"
            >
              <input
                type="checkbox"
                checked={selectedStars.includes(star)}
                onChange={() => onStarToggle(star)}
                className="w-4 h-4 rounded border-slate-300 text-trivia-500 focus:ring-trivia-500"
              />
              <div className="flex items-center gap-0.5">
                {[...Array(star)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-slate-700">{star} stars</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Price Range */}
      <FilterGroup title="Price per night (USD)">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0, priceMax)}
              min={minPrice}
              max={maxPrice}
              placeholder="Min"
              className="form-input text-sm"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => onPriceChange(priceMin, parseFloat(e.target.value) || maxPrice)}
              min={minPrice}
              max={maxPrice}
              placeholder="Max"
              className="form-input text-sm"
            />
          </div>
          <div className="text-xs text-slate-500">
            Available range: ${minPrice.toFixed(0)} – ${maxPrice.toFixed(0)}
          </div>
        </div>
      </FilterGroup>

      {/* Amenities */}
      {allAmenities.length > 0 && (
        <FilterGroup title="Amenities">
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {allAmenities.map((a) => (
              <label
                key={a}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 px-2 py-1.5 -mx-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(a)}
                  onChange={() => onAmenityToggle(a)}
                  className="w-4 h-4 rounded border-slate-300 text-trivia-500 focus:ring-trivia-500"
                />
                <span className="text-sm text-slate-700">{a}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-5 border-b border-slate-100 last:border-0 last:pb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        {title}
      </h4>
      {children}
    </div>
  );
}
