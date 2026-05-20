"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Filter as FilterIcon,
  X,
  ArrowUpDown,
  Hotel as HotelIcon,
} from "lucide-react";
import Link from "next/link";
import { HotelFilters } from "./hotel-filters";
import { HotelCard } from "./hotel-card";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  starRating: number | null;
  shortDesc: string | null;
  amenities: string[] | null;
  countryId: string;
  countryName: string | null;
  countryCode: string | null;
  coverImage: string | null;
  minPrice: number | null;
};

type Props = {
  hotels: Hotel[];
  searchParams: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    pax?: string;
  };
};

export function ResultsClient({ hotels, searchParams }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Compute price range from data
  const priceRange = useMemo(() => {
    const prices = hotels
      .map((h) => (h.minPrice != null ? Number(h.minPrice) : null))
      .filter((p): p is number => p !== null && !isNaN(p) && p > 0);
    if (prices.length === 0) return { min: 0, max: 1000 };
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [hotels]);

  // Compute available amenities from data
  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    hotels.forEach((h) => (h.amenities ?? []).forEach((a) => set.add(a)));
    return Array.from(set).sort();
  }, [hotels]);

  // Filter state
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(priceRange.min);
  const [priceMax, setPriceMax] = useState(priceRange.max);
  const [sortBy, setSortBy] = useState<"best" | "price_asc" | "price_desc" | "stars_desc">("best");

  // Apply filters in-memory
  const filteredAndSorted = useMemo(() => {
    let result = [...hotels];

    if (selectedStars.length > 0) {
      result = result.filter((h) => h.starRating && selectedStars.includes(h.starRating));
    }

    if (selectedAmenities.length > 0) {
      result = result.filter((h) =>
        selectedAmenities.every((a) =>
          (h.amenities ?? []).some((ha) => ha.toLowerCase() === a.toLowerCase())
        )
      );
    }

    result = result.filter((h) => {
      const p = h.minPrice != null ? Number(h.minPrice) : 0;
      return p >= priceMin && p <= priceMax;
    });

    // Sort
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => (a.minPrice != null ? Number(a.minPrice) : 99999) - (b.minPrice != null ? Number(b.minPrice) : 99999));
        break;
      case "price_desc":
        result.sort((a, b) => (b.minPrice != null ? Number(b.minPrice) : 0) - (a.minPrice != null ? Number(a.minPrice) : 0));
        break;
      case "stars_desc":
        result.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0));
        break;
      default:
        result.sort((a, b) => {
          const aHasPrice = a.minPrice ? 1 : 0;
          const bHasPrice = b.minPrice ? 1 : 0;
          if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice;
          return (b.starRating ?? 0) - (a.starRating ?? 0);
        });
    }

    return result;
  }, [hotels, selectedStars, selectedAmenities, priceMin, priceMax, sortBy]);

  const hasActiveFilters =
    selectedStars.length > 0 ||
    selectedAmenities.length > 0 ||
    priceMin > priceRange.min ||
    priceMax < priceRange.max;

  function handleStarToggle(star: number) {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  }

  function handleAmenityToggle(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function handleClearAll() {
    setSelectedStars([]);
    setSelectedAmenities([]);
    setPriceMin(priceRange.min);
    setPriceMax(priceRange.max);
  }

  // Calculate nights for display
  const nights = searchParams.checkIn && searchParams.checkOut
    ? Math.max(
        1,
        Math.ceil(
          (new Date(searchParams.checkOut).getTime() -
            new Date(searchParams.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Link
        href="/hotels"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Modify search
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {hotels.length} {hotels.length === 1 ? "hotel" : "hotels"} found
          </h1>
          {searchParams.checkIn && searchParams.checkOut && (
            <p className="text-sm text-slate-500 mt-1">
              {formatDate(searchParams.checkIn)} → {formatDate(searchParams.checkOut)} ·{" "}
              {nights} {nights === 1 ? "night" : "nights"} · {searchParams.pax || 2}{" "}
              {parseInt(searchParams.pax || "2") === 1 ? "guest" : "guests"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <FilterIcon className="w-4 h-4" />
            Filters
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-trivia-500/30"
            >
              <option value="best">Sort: Best match</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stars_desc">Stars: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block md:col-span-3">
          <HotelFilters
            selectedStars={selectedStars}
            onStarToggle={handleStarToggle}
            allAmenities={allAmenities}
            selectedAmenities={selectedAmenities}
            onAmenityToggle={handleAmenityToggle}
            minPrice={priceRange.min}
            maxPrice={priceRange.max}
            priceMin={priceMin}
            priceMax={priceMax}
            onPriceChange={(min, max) => {
              setPriceMin(min);
              setPriceMax(max);
            }}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Results */}
        <div className="md:col-span-9 space-y-3">
          {filteredAndSorted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <HotelIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              {hotels.length === 0 ? (
                <>
                  <p className="text-slate-700 font-medium mb-1">
                    No hotels match your search
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Try different dates or destinations
                  </p>
                  <Link
                    href="/hotels"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Modify search
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-slate-700 font-medium mb-1">
                    No hotels match your filters
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-trivia-600 hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredAndSorted.map((h) => (
              <HotelCard
                key={h.id}
                hotel={h}
                searchParams={params.toString()}
                nights={nights}
              />
            ))
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileFiltersOpen(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Filter results</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <HotelFilters
                selectedStars={selectedStars}
                onStarToggle={handleStarToggle}
                allAmenities={allAmenities}
                selectedAmenities={selectedAmenities}
                onAmenityToggle={handleAmenityToggle}
                minPrice={priceRange.min}
                maxPrice={priceRange.max}
                priceMin={priceMin}
                priceMax={priceMax}
                onPriceChange={(min, max) => {
                  setPriceMin(min);
                  setPriceMax(max);
                }}
                onClearAll={handleClearAll}
                hasActiveFilters={hasActiveFilters}
              />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full mt-4 py-3 bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl font-semibold"
              >
                Show {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "hotel" : "hotels"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
