"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Package2, Search } from "lucide-react";
import { PackageBrowseCard } from "@/components/ui/package-browse-card";
import { PackageFilterSidebar } from "./package-filter-sidebar";
import { getPackagesForBrowse, type PackageBrowseFilters } from "./actions";

type PackageRow = {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  durationDays: number;
  countryId: string;
  countryName: string | null;
  countryCode: string | null;
  coverImage: string | null;
  fromPrice: string | null;
};

type Country = { id: string; name: string; code: string | null };

type Props = {
  initialPackages: PackageRow[];
  countries: Country[];
};

export function PackagesBrowse({ initialPackages, countries }: Props) {
  const [packages, setPackages] = useState<PackageRow[]>(initialPackages);
  const [filters, setFilters] = useState<PackageBrowseFilters>({
    sort: "name-asc",
  });
  const [isPending, startTransition] = useTransition();
  const isFirstRun = useRef(true);

  // Debounced refetch on any filter change (handles typed search + price inputs).
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await getPackagesForBrowse(filters);
        setPackages(result);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <PackageFilterSidebar
        countries={countries}
        filters={filters}
        onChange={setFilters}
        resultCount={packages.length}
      />

      <div className="flex-1 min-w-0 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            placeholder="Search packages..."
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500 bg-white"
          />
        </div>

        {/* Count row */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {packages.length}
            </span>{" "}
            {packages.length === 1 ? "package" : "packages"}
            {isPending && (
              <span className="ml-2 text-slate-400">Updating...</span>
            )}
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Package2 className="w-12 h-12 text-trivia-300 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">
              No packages match your filters.
            </p>
            <p className="text-sm text-slate-500">
              Try adjusting or clearing your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <PackageBrowseCard key={pkg.id} {...pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
