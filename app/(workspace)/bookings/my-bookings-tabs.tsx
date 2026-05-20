"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Hotel as HotelIcon,
  Search,
  MapPin,
  ArrowRight,
  Plane,
} from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";

type TourBooking = {
  id: string;
  bookingNo: string;
  customerName: string;
  status: string;
  totalPrice: string;
  productName?: string | null;
  countryName?: string | null;
  countryCode?: string | null;
  travelDate?: string | null;
  createdAt: Date;
};

type HotelBooking = {
  id: string;
  bookingNo: string;
  customerName: string;
  status: string;
  totalPrice: string;
  hotelName: string | null;
  countryCode: string | null;
  roomTypeName: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  createdAt: Date;
};

type Props = {
  tourBookings: TourBooking[];
  hotelBookings: HotelBooking[];
};

const STATUS_COLORS: Record<string, string> = {
  // Tours
  NEW: "bg-red-100 text-red-700",
  ACK: "bg-blue-100 text-blue-700",
  SUPPLIER_CONTACTED: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  VOUCHER_ISSUED: "bg-teal-100 text-teal-700",
  OPERATED: "bg-cyan-100 text-cyan-700",
  CLOSED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-50 text-red-700",
  // Hotels (some shared, some unique)
  HOTEL_CONTACTED: "bg-amber-100 text-amber-700",
  AWAITING_INVOICE: "bg-purple-100 text-purple-700",
  CHECKED_IN: "bg-cyan-100 text-cyan-700",
  CHECKED_OUT: "bg-slate-200 text-slate-700",
  COMPLETED: "bg-slate-100 text-slate-700",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
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
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MyBookingsTabs({ tourBookings, hotelBookings }: Props) {
  const [tab, setTab] = useState<"all" | "tours" | "hotels">("all");
  const [search, setSearch] = useState("");

  // Combine for "all" view
  type CombinedItem =
    | { type: "tour"; data: TourBooking; sortDate: Date }
    | { type: "hotel"; data: HotelBooking; sortDate: Date };

  const allBookings: CombinedItem[] = useMemo(() => {
    const tours: CombinedItem[] = tourBookings.map((b) => ({
      type: "tour",
      data: b,
      sortDate: new Date(b.createdAt),
    }));
    const hotels: CombinedItem[] = hotelBookings.map((b) => ({
      type: "hotel",
      data: b,
      sortDate: new Date(b.createdAt),
    }));
    return [...tours, ...hotels].sort(
      (a, b) => b.sortDate.getTime() - a.sortDate.getTime()
    );
  }, [tourBookings, hotelBookings]);

  // Filter by search
  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    const matchesSearch = (
      bookingNo: string,
      customer: string,
      product: string | null | undefined
    ) =>
      !search ||
      bookingNo.toLowerCase().includes(lower) ||
      customer.toLowerCase().includes(lower) ||
      product?.toLowerCase().includes(lower);

    if (tab === "all") {
      return allBookings.filter((item) =>
        item.type === "tour"
          ? matchesSearch(
              item.data.bookingNo,
              item.data.customerName,
              item.data.productName
            )
          : matchesSearch(
              item.data.bookingNo,
              item.data.customerName,
              item.data.hotelName
            )
      );
    }
    if (tab === "tours") {
      return tourBookings
        .filter((b) =>
          matchesSearch(b.bookingNo, b.customerName, b.productName)
        )
        .map<CombinedItem>((b) => ({
          type: "tour",
          data: b,
          sortDate: new Date(b.createdAt),
        }));
    }
    return hotelBookings
      .filter((b) => matchesSearch(b.bookingNo, b.customerName, b.hotelName))
      .map<CombinedItem>((b) => ({
        type: "hotel",
        data: b,
        sortDate: new Date(b.createdAt),
      }));
  }, [tab, search, tourBookings, hotelBookings, allBookings]);

  // Stats
  const totalRevenue = useMemo(() => {
    return [
      ...tourBookings.map((b) => Number(b.totalPrice)),
      ...hotelBookings.map((b) => Number(b.totalPrice)),
    ].reduce((a, b) => a + b, 0);
  }, [tourBookings, hotelBookings]);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatPill label="All Bookings" value={tourBookings.length + hotelBookings.length} />
        <StatPill label="Tours" value={tourBookings.length} color="blue" />
        <StatPill label="Hotels" value={hotelBookings.length} color="amber" />
        <StatPill label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} color="emerald" />
      </div>

      {/* Tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <TabButton
              active={tab === "all"}
              onClick={() => setTab("all")}
              count={tourBookings.length + hotelBookings.length}
            >
              All
            </TabButton>
            <TabButton
              active={tab === "tours"}
              onClick={() => setTab("tours")}
              count={tourBookings.length}
              icon={Plane}
            >
              Tours
            </TabButton>
            <TabButton
              active={tab === "hotels"}
              onClick={() => setTab("hotels")}
              count={hotelBookings.length}
              icon={HotelIcon}
            >
              Hotels
            </TabButton>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
            />
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              <Plane className="w-3.5 h-3.5" />
              New Tour
            </Link>
            <Link
              href="/hotels"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg shadow-sm"
            >
              <HotelIcon className="w-3.5 h-3.5" />
              New Hotel
            </Link>
          </div>
        </div>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          {tab === "hotels" ? (
            <HotelIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          ) : tab === "tours" ? (
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          ) : (
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          )}
          {tourBookings.length + hotelBookings.length === 0 ? (
            <>
              <p className="text-slate-700 font-medium mb-1">No bookings yet</p>
              <p className="text-sm text-slate-500 mb-4">
                Create your first booking to get started
              </p>
              <div className="flex items-center justify-center gap-2">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  Browse Tours
                </Link>
                <Link
                  href="/hotels"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg"
                >
                  Browse Hotels
                </Link>
              </div>
            </>
          ) : (
            <p className="text-slate-600">No bookings match your filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) =>
            item.type === "tour" ? (
              <TourBookingCard key={`tour-${item.data.id}`} booking={item.data} />
            ) : (
              <HotelBookingCard key={`hotel-${item.data.id}`} booking={item.data} />
            )
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-sm text-slate-500 mt-4">
          {filtered.length} of {tourBookings.length + hotelBookings.length} bookings
        </p>
      )}
    </>
  );
}

// ─── Tab Button ──────────────────────────────

function TabButton({
  active,
  onClick,
  count,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        active
          ? "bg-white text-trivia-700 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
      <span
        className={`ml-1 px-1.5 py-0.5 rounded text-xs font-mono ${
          active ? "bg-trivia-100 text-trivia-700" : "bg-slate-200 text-slate-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Stat Pill ───────────────────────────────

function StatPill({
  label,
  value,
  color = "default",
}: {
  label: string;
  value: number | string;
  color?: "default" | "blue" | "amber" | "emerald";
}) {
  const colors = {
    default: "bg-white border-slate-200 text-slate-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

// ─── Tour Booking Card ───────────────────────

function TourBookingCard({ booking }: { booking: TourBooking }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="block bg-white rounded-2xl border border-slate-200 hover:border-trivia-300 hover:shadow-soft transition-all p-4 group"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Plane className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-900">
              {booking.bookingNo}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                STATUS_COLORS[booking.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {booking.status.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400">· {timeAgo(booking.createdAt)}</span>
          </div>
          <p className="text-sm font-medium text-slate-900 mt-1 truncate">
            {booking.customerName}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {booking.productName && (
              <span className="truncate">{booking.productName}</span>
            )}
            {booking.countryName && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booking.countryCode && (
                  <CountryFlag code={booking.countryCode} name={booking.countryName} />
                )}
                {booking.countryName}
              </span>
            )}
          </div>
        </div>

        {/* Price + Arrow */}
        <div className="text-right flex-shrink-0">
          <div className="font-mono font-bold text-slate-900">
            ${Number(booking.totalPrice).toFixed(0)}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-trivia-500 mt-1 ml-auto transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// ─── Hotel Booking Card ──────────────────────

function HotelBookingCard({ booking }: { booking: HotelBooking }) {
  return (
    <Link
      href={`/ops/hotel-bookings/${booking.id}`}
      className="block bg-white rounded-2xl border border-slate-200 hover:border-trivia-300 hover:shadow-soft transition-all p-4 group"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <HotelIcon className="w-5 h-5 text-amber-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-semibold text-slate-900">
              {booking.bookingNo}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                STATUS_COLORS[booking.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {booking.status.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400">· {timeAgo(booking.createdAt)}</span>
          </div>
          <p className="text-sm font-medium text-slate-900 mt-1 truncate">
            {booking.customerName}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="truncate">{booking.hotelName}</span>
            <span>
              {formatDate(booking.checkIn)} · {booking.nights}n
            </span>
          </div>
        </div>

        {/* Price + Arrow */}
        <div className="text-right flex-shrink-0">
          <div className="font-mono font-bold text-slate-900">
            ${Number(booking.totalPrice).toFixed(0)}
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-trivia-500 mt-1 ml-auto transition-colors" />
        </div>
      </div>
    </Link>
  );
}
