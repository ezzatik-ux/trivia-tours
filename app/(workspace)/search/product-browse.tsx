"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { Package2 } from "lucide-react";
import { FilterSidebar } from "./filter-sidebar";
import { ProductSearchCard } from "@/components/ui/product-search-card";
import { searchProducts, type BrowseFilters } from "./actions";

type ProductType = "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";
type SortBy = "price-asc" | "price-desc" | "name-asc" | "duration-asc";

type Product = {
  id: string;
  type: ProductType;
  name: string;
  shortDesc: string | null;
  durationHours: string | null;
  countryId: string;
  countryName: string | null;
  countryCode: string | null;
  coverImage: string | null;
  fromPrice: string | null;
};

type Props = {
  initialProducts: Product[];
  countryId?: string | null;
};

export function ProductBrowse({ initialProducts, countryId }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<ProductType[]>([]);
  const [durationRange, setDurationRange] = useState<{
    min: number | null;
    max: number | null;
  }>({ min: null, max: null });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("price-asc");

  // Refetch products whenever filters change
  useEffect(() => {
    const filters: BrowseFilters = {
      countryId: countryId ?? null,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      search: search.trim() || undefined,
      minDuration: durationRange.min,
      maxDuration: durationRange.max,
      sortBy,
    };

    startTransition(async () => {
      const result = await searchProducts(filters);
      setProducts(result);
    });
  }, [countryId, selectedTypes, durationRange, search, sortBy]);

  function handleTypeToggle(type: ProductType) {
    setSelectedTypes((curr) =>
      curr.includes(type) ? curr.filter((t) => t !== type) : [...curr, type]
    );
  }

  function handleClearAll() {
    setSelectedTypes([]);
    setDurationRange({ min: null, max: null });
    setSearch("");
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Filter Sidebar */}
      <FilterSidebar
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        durationRange={durationRange}
        onDurationChange={(min, max) => setDurationRange({ min, max })}
        search={search}
        onSearchChange={setSearch}
        onClearAll={handleClearAll}
        resultCount={products.length}
      />

      {/* Main results area */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{products.length}</span>{" "}
            {products.length === 1 ? "result" : "results"}
            {isPending && <span className="ml-2 text-slate-400">Updating...</span>}
          </p>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="duration-asc">Duration: Shortest</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Package2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">No products match your filters</p>
            <p className="text-sm text-slate-500 mb-4">
              Try removing some filters to see more results
            </p>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductSearchCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
