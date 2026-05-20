"use client";

import Link from "next/link";
import {
  Plane,
  TrendingUp,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
} from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";

type Stats = {
  catalog: {
    totalProducts: number;
    activeProducts: number;
  };
  bookings: {
    total: number;
    thisMonth: number;
    pending: number;
    confirmed: number;
    revenue: number;
  };
};

type RecentBooking = {
  id: string;
  bookingNo: string;
  customerName: string;
  status: string;
  totalPrice: string;
  travelDate: string;
  createdAt: Date;
  productName: string | null;
  countryCode: string | null;
};

type Props = {
  role: "SALES" | "OPS" | "PRODUCT" | "ADMIN";
  stats: Stats;
  recentBookings: RecentBooking[];
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-100 text-red-700",
  ACK: "bg-blue-100 text-blue-700",
  SUPPLIER_CONTACTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  VOUCHER_ISSUED: "bg-teal-100 text-teal-700",
  OPERATED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-50 text-red-700",
};

function formatShortDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(d: Date) {
  const seconds = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ToursDashboardWidget({ role, stats, recentBookings }: Props) {
  const isSales = role === "SALES";
  const isOps = role === "OPS" || role === "ADMIN";
  const isProduct = role === "PRODUCT" || role === "ADMIN";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Plane className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tours</h2>
            <p className="text-xs text-slate-500">
              {isSales
                ? "Your tour bookings"
                : isOps
                ? "Tour reservations overview"
                : "Tour catalog & bookings"}
            </p>
          </div>
        </div>

        {role === "SALES" || role === "ADMIN" ? (
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Tour Booking
          </Link>
        ) : role === "PRODUCT" ? (
          <Link
            href="/products/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tour
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label={isSales ? "My Bookings" : "Bookings"}
          subLabel="This month"
          value={stats.bookings.thisMonth}
          icon={Calendar}
          accent="blue"
        />

        {isOps ? (
          <StatCard
            label="Pending Action"
            subLabel="Need confirmation"
            value={stats.bookings.pending}
            icon={Clock}
            accent="amber"
            urgent={stats.bookings.pending > 0}
          />
        ) : (
          <StatCard
            label="Confirmed"
            subLabel="In progress"
            value={stats.bookings.confirmed}
            icon={Clock}
            accent="emerald"
          />
        )}

        <StatCard
          label="Revenue"
          subLabel="This month"
          value={`$${stats.bookings.revenue.toFixed(0)}`}
          icon={TrendingUp}
          accent="emerald"
        />

        {isProduct ? (
          <StatCard
            label="Products"
            subLabel={`${stats.catalog.activeProducts} active`}
            value={stats.catalog.totalProducts}
            icon={Plane}
            accent="default"
          />
        ) : (
          <StatCard
            label="Catalog"
            subLabel="Active products"
            value={stats.catalog.activeProducts}
            icon={Plane}
            accent="default"
          />
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isSales ? "Your Recent Bookings" : "Recent Bookings"}
          </h3>
          <Link
            href={isSales ? "/bookings" : "/ops/queue"}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            View all →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center">
            <Plane className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium mb-1">No tour bookings yet</p>
            <p className="text-xs text-slate-400 mb-3">
              {isSales ? "Search tours to create your first booking" : "Tour bookings will appear here"}
            </p>
            {(isSales || role === "ADMIN") && (
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium"
              >
                <Plus className="w-3 h-3" />
                Search Tours
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentBookings.slice(0, 5).map((b) => (
              <RecentBookingRow key={b.id} booking={b} isSales={isSales} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  subLabel,
  value,
  icon: Icon,
  accent,
  urgent,
}: {
  label: string;
  subLabel?: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "default" | "blue" | "amber" | "emerald";
  urgent?: boolean;
}) {
  const accents = {
    default: "bg-white border-slate-200",
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
    emerald: "bg-emerald-50 border-emerald-200",
  };

  const iconColors = {
    default: "text-slate-400",
    blue: "text-blue-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${accents[accent]} ${
        urgent ? "ring-2 ring-amber-300 ring-offset-1" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            {label}
          </p>
          {subLabel && (
            <p className="text-[10px] text-slate-400 mt-0.5">{subLabel}</p>
          )}
        </div>
        <Icon className={`w-4 h-4 ${iconColors[accent]}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function RecentBookingRow({
  booking,
  isSales,
}: {
  booking: RecentBooking;
  isSales: boolean;
}) {
  return (
    <Link
      href={isSales ? `/bookings/${booking.id}` : `/ops/bookings/${booking.id}`}
      className="block px-5 py-3 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs font-semibold text-slate-900">
              {booking.bookingNo}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                STATUS_COLORS[booking.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {booking.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-slate-400">· {timeAgo(booking.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-900 truncate">{booking.customerName}</span>
            <span className="text-slate-400">·</span>
            <span className="inline-flex items-center gap-1 text-slate-600 text-xs truncate">
              {booking.countryCode && <CountryFlag code={booking.countryCode} />}
              {booking.productName}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-mono font-bold text-slate-900 text-sm">
            ${Number(booking.totalPrice).toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">
            Travel {formatShortDate(booking.travelDate)}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </Link>
  );
}
