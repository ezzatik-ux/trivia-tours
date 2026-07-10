"use client";

import { useState, useTransition } from "react";
import { Package2, Search } from "lucide-react";
import { PackageBrowseCard } from "@/components/ui/package-browse-card";
import { getPackagesForBrowse } from "./actions";

type PackageRow = {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  durationDays: number;
  countryName: string | null;
  countryCode: string | null;
  coverImage: string | null;
  fromPrice: string | null;
};

type Props = {
  initialPackages: PackageRow[];
};

export function PackagesBrowse({ initialPackages }: Props) {
  const [packages, setPackages] = useState<PackageRow[]>(initialPackages);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSearchChange(value: string) {
    setSearch(value);
    startTransition(async () => {
      const result = await getPackagesForBrowse(value);
      setPackages(result);
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search packages..."
          className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500 bg-white"
        />
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{packages.length}</span>{" "}
          {packages.length === 1 ? "package" : "packages"}
          {isPending && <span className="ml-2 text-slate-400">Updating...</span>}
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Package2 className="w-12 h-12 text-trivia-300 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">No packages found.</p>
          <p className="text-sm text-slate-500">
            Try a different search, or check back when packages are published.
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
  );
}
