"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Users,
  FilterX,
  Package2,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";

type Booking = {
  id: string;
  bookingNo: string;
  salesOrderNo: string;
  customerName: string;
  travelDate: string;
  totalPax: number;
  totalPrice: string;
  status: "NEW" | "ACK" | "SUPPLIER_CONTACTED" | "CONFIRMED" | "VOUCHER_ISSUED" | "OPERATED" | "CLOSED" | "CANCELLED";
  paymentStatus: string;
  createdAt: Date;
  productName: string | null;
  productType: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER" | null;
  countryFlag: string | null;
  countryName: string | null;
};

type Props = {
  bookings: Booking[];
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All", color: "bg-slate-100 text-slate-700" },
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "SUPPLIER_CONTACTED", label: "In Progress", color: "bg-amber-100 text-amber-700" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  { value: "OPERATED", label: "Operated", color: "bg-purple-100 text-purple-700" },
  { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-700" },
];

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  ACK: "Acknowledged",
  SUPPLIER_CONTACTED: "Supplier Contacted",
  CONFIRMED: "Confirmed",
  VOUCHER_ISSUED: "Voucher Issued",
  OPERATED: "Operated",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  ACK: "bg-cyan-100 text-cyan-700 border-cyan-200",
  SUPPLIER_CONTACTED: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  VOUCHER_ISSUED: "bg-purple-100 text-purple-700 border-purple-200",
  OPERATED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export function BookingsTable({ bookings }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Filter bookings
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !search ||
        b.bookingNo.toLowerCase().includes(search.toLowerCase()) ||
        b.salesOrderNo.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.productName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "SUPPLIER_CONTACTED" && ["ACK", "SUPPLIER_CONTACTED"].includes(b.status)) ||
        b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter(
      (b) => !["CANCELLED", "CLOSED"].includes(b.status)
    ).length;
    const revenue = bookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
    const pending = bookings.filter((b) =>
      ["NEW", "ACK", "SUPPLIER_CONTACTED"].includes(b.status)
    ).length;

    return { total, active, revenue, pending };
  }, [bookings]);

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("ALL");
  }

  const hasActiveFilters = search || statusFilter !== "ALL";

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
        <Package2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-medium mb-1">No bookings yet</p>
        <p className="text-sm text-slate-500 mb-4">
          Start by searching for a product and creating your first booking
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
        >
          <Search className="w-4 h-4" />
          Search Products
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Package2}
          label="Total Bookings"
          value={stats.total}
        />
        <StatCard
          icon={TrendingUp}
          label="Active"
          value={stats.active}
          variant="emerald"
        />
        <StatCard
          icon={Calendar}
          label="Pending"
          value={stats.pending}
          variant="amber"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          variant="slate"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 space-y-3">
        {/* Search + status filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by booking #, customer, or sales order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FilterX className="w-4 h-4" />
              Clear filters
            </button>
          )}

          <Link
            href="/search"
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            New Booking
          </Link>
        </div>

        {/* Status pill row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                statusFilter === filter.value
                  ? "bg-slate-900 text-white"
                  : `${filter.color} hover:opacity-80`
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No bookings match your filters</p>
            <button
              onClick={handleClearFilters}
              className="text-sm text-slate-900 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Travel Date
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Pax
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/bookings/${booking.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {booking.bookingNo}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        SO: {booking.salesOrderNo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {booking.productName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {booking.productType && (
                          <ProductTypeBadge type={booking.productType} />
                        )}
                        {booking.countryFlag && (
                          <span className="text-xs text-slate-500">
                            {booking.countryFlag} {booking.countryName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{booking.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(booking.travelDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {booking.totalPax}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      ${parseFloat(booking.totalPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          STATUS_COLORS[booking.status] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </p>
      )}
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: "default" | "emerald" | "amber" | "slate";
}) {
  const variants = {
    default: "bg-white border-slate-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    slate: "bg-slate-50 border-slate-200",
  };
  const iconColors = {
    default: "text-slate-400",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    slate: "text-slate-600",
  };

  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <Icon className={`w-4 h-4 ${iconColors[variant]}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
