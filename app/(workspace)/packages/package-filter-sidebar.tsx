"use client";

import { X } from "lucide-react";
import type { PackageBrowseFilters } from "./actions";

type Country = { id: string; name: string; code: string | null };

const DURATION_OPTIONS: Array<{
  value: PackageBrowseFilters["durationBucket"] | "";
  label: string;
}> = [
  { value: "", label: "Any duration" },
  { value: "1-3", label: "1–3 days" },
  { value: "4-7", label: "4–7 days" },
  { value: "8-14", label: "8–14 days" },
  { value: "15+", label: "15+ days" },
];

const SORT_OPTIONS: Array<{
  value: NonNullable<PackageBrowseFilters["sort"]>;
  label: string;
}> = [
  { value: "name-asc", label: "Name: A → Z" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "duration-asc", label: "Duration: Shortest" },
  { value: "newest", label: "Newest" },
];

type Props = {
  countries: Country[];
  filters: PackageBrowseFilters;
  onChange: (filters: PackageBrowseFilters) => void;
  resultCount: number;
};

export function PackageFilterSidebar({
  countries,
  filters,
  onChange,
  resultCount,
}: Props) {
  const hasFilters =
    !!filters.countryId ||
    !!filters.durationBucket ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    (filters.sort && filters.sort !== "name-asc");

  function patch(next: Partial<PackageBrowseFilters>) {
    onChange({ ...filters, ...next });
  }

  function clearAll() {
    onChange({ search: filters.search, sort: "name-asc" });
  }

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="md:sticky md:top-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Filters</h2>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Country */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Country
          </label>
          <select
            value={filters.countryId ?? ""}
            onChange={(e) =>
              patch({ countryId: e.target.value || undefined })
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500 bg-white"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Duration
          </p>
          <div className="space-y-1.5">
            {DURATION_OPTIONS.map((opt) => {
              const isActive =
                (filters.durationBucket ?? "") === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() =>
                    patch({
                      durationBucket: opt.value || undefined,
                    })
                  }
                  className={
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors " +
                    (isActive
                      ? "bg-trivia-600 text-white"
                      : "text-slate-700 hover:bg-slate-50")
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Price (from)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                patch({
                  minPrice:
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value),
                })
              }
              placeholder="Min"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              min={0}
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                patch({
                  maxPrice:
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value),
                })
              }
              placeholder="Max"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Sort by
          </label>
          <select
            value={filters.sort ?? "name-asc"}
            onChange={(e) =>
              patch({
                sort: e.target.value as NonNullable<
                  PackageBrowseFilters["sort"]
                >,
              })
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500 bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{resultCount}</span>{" "}
            {resultCount === 1 ? "package" : "packages"}
          </p>
        </div>
      </div>
    </aside>
  );
}
