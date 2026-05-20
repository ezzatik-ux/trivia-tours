"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Edit2,
  Plus,
  Search,
  Hotel as HotelIcon,
  Trash2,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { StatusBadge } from "@/components/ui/status-badge";
import { CountryFlag, countryFlagEmoji } from "@/components/ui/country-flag";
import { cycleHotelStatus, deleteHotel } from "./actions";

type Country = {
  id: string;
  code: string | null;
  name: string;
};

type Hotel = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  starRating: number | null;
  shortDesc: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  countryId: string;
  countryName: string | null;
  countryCode: string | null;
  coverImage: string | null;
  createdAt: Date;
};

type Props = {
  hotels: Hotel[];
  countries: Country[];
};

export function HotelsTable({ hotels, countries }: Props) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [starFilter, setStarFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      const matchesSearch =
        !search ||
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.brand?.toLowerCase().includes(search.toLowerCase()) ||
        h.countryName?.toLowerCase().includes(search.toLowerCase());
      const matchesCountry = countryFilter === "ALL" || h.countryId === countryFilter;
      const matchesStatus = statusFilter === "ALL" || h.status === statusFilter;
      const matchesStar = starFilter === "ALL" || h.starRating?.toString() === starFilter;
      return matchesSearch && matchesCountry && matchesStatus && matchesStar;
    });
  }, [hotels, search, countryFilter, statusFilter, starFilter]);

  const stats = useMemo(() => ({
    total: hotels.length,
    active: hotels.filter((h) => h.status === "ACTIVE").length,
    draft: hotels.filter((h) => h.status === "DRAFT").length,
    fiveStar: hotels.filter((h) => h.starRating === 5).length,
    countries: new Set(hotels.map((h) => h.countryId)).size,
  }), [hotels]);

  function handleStatusClick(id: string, currentStatus: "DRAFT" | "ACTIVE" | "INACTIVE") {
    startTransition(async () => {
      await cycleHotelStatus(id, currentStatus);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all room types, rates, and bookings. This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteHotel(id);
    });
  }

  function clearFilters() {
    setSearch("");
    setCountryFilter("ALL");
    setStatusFilter("ALL");
    setStarFilter("ALL");
  }

  const hasActiveFilters =
    search || countryFilter !== "ALL" || statusFilter !== "ALL" || starFilter !== "ALL";

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatPill label="Total Hotels" value={stats.total} />
        <StatPill label="Active" value={stats.active} color="emerald" />
        <StatPill label="Draft" value={stats.draft} color="slate" />
        <StatPill label="5-Star" value={stats.fiveStar} color="amber" />
        <StatPill label="Countries" value={stats.countries} />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hotels by name, brand, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
            />
          </div>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-trivia-500/30"
          >
            <option value="ALL">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {countryFlagEmoji(c.code)} {c.name}
              </option>
            ))}
          </select>

          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-trivia-500/30"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Star</option>
            <option value="4">4 Star</option>
            <option value="3">3 Star</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-trivia-500/30"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Clear
            </button>
          )}

          <Link
            href="/admin/hotels/new"
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Hotel
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <HotelIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {hotels.length === 0 ? (
              <>
                <p className="text-slate-700 font-medium mb-1">No hotels yet</p>
                <p className="text-sm text-slate-400 mb-4">
                  Upload your first hotel contract to get started
                </p>
                <Link
                  href="/admin/hotels/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add your first hotel
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium mb-1">No hotels match your filters</p>
                <button onClick={clearFilters} className="text-sm text-trivia-600 hover:underline">
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Hotel</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Rating</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Location</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {hotel.coverImage ? (
                        <img
                          src={hotel.coverImage}
                          alt={hotel.name}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{hotel.name}</div>
                        {hotel.brand && (
                          <div className="text-xs text-slate-500 mt-0.5">{hotel.brand}</div>
                        )}
                        {hotel.shortDesc && (
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-[300px]">
                            {hotel.shortDesc}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <StarRating rating={hotel.starRating} />
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {hotel.countryCode && (
                        <CountryFlag code={hotel.countryCode} name={hotel.countryName} />
                      )}
                      <span>{hotel.countryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleStatusClick(hotel.id, hotel.status)}
                      disabled={isPending}
                      className="cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                      title="Click to cycle status"
                    >
                      <StatusBadge status={hotel.status} />
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/hotels/${hotel.id}/edit`}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit hotel"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(hotel.id, hotel.name)}
                        disabled={isPending}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete hotel"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {hotels.length > 0 && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          Showing {filtered.length} of {hotels.length} hotels
        </div>
      )}
    </>
  );
}

function StatPill({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: number;
  color?: "default" | "emerald" | "slate" | "amber";
}) {
  const colors = {
    default: "bg-white border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
