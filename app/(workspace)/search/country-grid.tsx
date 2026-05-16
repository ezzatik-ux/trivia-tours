"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Globe } from "lucide-react";
import { CountryCard } from "@/components/ui/country-card";

type Country = {
  id: string;
  code: string;
  name: string;
  flagEmoji: string | null;
  productCount: number;
};

type Props = {
  countries: Country[];
};

export function CountryGrid({ countries }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const lower = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower)
    );
  }, [countries, search]);

  // Sort: countries with products first, then alphabetical within each group
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.productCount > 0 && b.productCount === 0) return -1;
      if (a.productCount === 0 && b.productCount > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const availableCount = countries.filter((c) => c.productCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Search + Browse All */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <Link
            href="/search/all"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Globe className="w-4 h-4" />
            Browse All Products
          </Link>
        </div>

        {search && (
          <p className="text-xs text-slate-500 mt-2">
            {sorted.length} {sorted.length === 1 ? "country" : "countries"} matching &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-1">No countries match your search</p>
          <button
            onClick={() => setSearch("")}
            className="text-sm text-slate-900 hover:underline font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sorted.map((country) => (
              <CountryCard
                key={country.id}
                countryId={country.id}
                name={country.name}
                flagEmoji={country.flagEmoji}
                productCount={country.productCount}
              />
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
            {availableCount} {availableCount === 1 ? "country" : "countries"} with available products
          </p>
        </>
      )}
    </div>
  );
}
