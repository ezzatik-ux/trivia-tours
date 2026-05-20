"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Hotel as HotelIcon,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  Award,
  Moon,
  Target,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { exportHotelBookingsCSV } from "./hotel-actions";
import { CountryFlag } from "@/components/ui/country-flag";

type HotelKpi = {
  totalBookings: number;
  totalRevenue: number;
  totalNetCost: number;
  margin: number;
  marginPct: number;
  confirmedBookings: number;
  cancelledBookings: number;
  conversionRate: number;
  totalNights: number;
  avgBookingValue: number;
};

type StatusDistribution = {
  status: string;
  count: number;
};

type TopHotel = {
  hotelId: string;
  hotelName: string | null;
  countryCode: string | null;
  countryName: string | null;
  bookingCount: number;
  totalRevenue: number;
  totalNights: number;
};

type RevenueComparison = {
  tours: { revenue: number; share: number };
  hotels: { revenue: number; share: number };
  total: number;
  hotelBookings: number;
};

type Props = {
  range: "week" | "month" | "quarter" | "year" | "all";
  kpi: HotelKpi;
  statusDistribution: StatusDistribution[];
  topHotels: TopHotel[];
  revenueComparison: RevenueComparison;
  canExport: boolean;
};

const STATUS_COLORS_HEX: Record<string, string> = {
  NEW: "#ef4444",
  ACK: "#3b82f6",
  HOTEL_CONTACTED: "#f59e0b",
  AWAITING_INVOICE: "#a855f7",
  CONFIRMED: "#10b981",
  VOUCHER_ISSUED: "#14b8a6",
  CHECKED_IN: "#06b6d4",
  CHECKED_OUT: "#64748b",
  COMPLETED: "#475569",
  CANCELLED: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  ACK: "Acknowledged",
  HOTEL_CONTACTED: "Hotel Contacted",
  AWAITING_INVOICE: "Awaiting Invoice",
  CONFIRMED: "Confirmed",
  VOUCHER_ISSUED: "Voucher Issued",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function HotelAnalyticsSection({
  range,
  kpi,
  statusDistribution,
  topHotels,
  revenueComparison,
  canExport,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // Chart data
  const pieData = statusDistribution.map((s) => ({
    name: STATUS_LABELS[s.status] ?? s.status,
    value: s.count,
    status: s.status,
  }));

  // Tours vs Hotels visualization
  const maxTourRev = revenueComparison.tours.revenue;
  const maxHotelRev = revenueComparison.hotels.revenue;
  const maxRev = Math.max(maxTourRev, maxHotelRev, 1);

  async function handleExport() {
    startTransition(async () => {
      try {
        const data = await exportHotelBookingsCSV(range);

        if (data.length === 0) {
          alert("No hotel bookings to export in this date range");
          return;
        }

        // Build CSV
        const headers = [
          "Booking No",
          "Status",
          "Customer Name",
          "Email",
          "Phone",
          "Check-in",
          "Check-out",
          "Nights",
          "Rooms",
          "Occupancy",
          "Adults",
          "Children",
          "Total Price ($)",
          "Net Cost ($)",
          "Hotel Confirmation",
          "Odoo Invoice",
          "Hotel",
          "Room Type",
          "Country",
          "Sales Agent",
          "Created",
        ];

        const csvRows = [
          headers.join(","),
          ...data.map((r) =>
            [
              r.bookingNo,
              r.status,
              `"${(r.customerName ?? "").replace(/"/g, '""')}"`,
              r.customerEmail ?? "",
              r.customerPhone ?? "",
              r.checkIn,
              r.checkOut,
              r.nights,
              r.numRooms,
              r.occupancy ?? "",
              r.adults,
              r.children,
              r.totalPrice,
              r.netCost ?? "0",
              r.hotelConfirmationRef ?? "",
              r.invoiceNoOdoo ?? "",
              `"${(r.hotelName ?? "").replace(/"/g, '""')}"`,
              `"${(r.roomTypeName ?? "").replace(/"/g, '""')}"`,
              r.countryName ?? "",
              `"${(r.salesAgentName ?? "").replace(/"/g, '""')}"`,
              new Date(r.createdAt).toISOString(),
            ].join(",")
          ),
        ];

        const csv = csvRows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hotel-bookings-${range}-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Export error:", error);
        alert("Failed to export. Please try again.");
      }
    });
  }

  return (
    <section className="space-y-4 pt-6 mt-6 border-t-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-trivia-50 flex items-center justify-center">
            <HotelIcon className="w-5 h-5 text-trivia-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hotel Performance</h2>
            <p className="text-xs text-slate-500">
              Bookings, revenue, and operational metrics
            </p>
          </div>
        </div>

        {canExport && (
          <button
            onClick={handleExport}
            disabled={isPending || kpi.totalBookings === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isPending ? "Exporting..." : "Export Hotels CSV"}
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Hotel Bookings"
          value={kpi.totalBookings}
          subtitle={`${kpi.confirmedBookings} confirmed`}
          icon={Calendar}
          accent="blue"
        />
        <KpiCard
          label="Hotel Revenue"
          value={`$${kpi.totalRevenue.toFixed(0)}`}
          subtitle={`avg $${kpi.avgBookingValue.toFixed(0)}/booking`}
          icon={DollarSign}
          accent="emerald"
        />
        <KpiCard
          label="Margin"
          value={`$${kpi.margin.toFixed(0)}`}
          subtitle={`${kpi.marginPct.toFixed(1)}% on revenue`}
          icon={TrendingUp}
          accent="amber"
        />
        <KpiCard
          label="Total Nights"
          value={kpi.totalNights}
          subtitle={`${kpi.conversionRate.toFixed(0)}% conversion`}
          icon={Moon}
          accent="default"
        />
      </div>

      {/* Revenue Comparison */}
      {revenueComparison.total > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Revenue Mix: Tours vs Hotels</h3>
          </div>

          <div className="space-y-3">
            {/* Tours bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium text-slate-900">Tours</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono font-bold text-slate-900">
                    ${revenueComparison.tours.revenue.toFixed(0)}
                  </span>
                  <span className="text-slate-500 w-12 text-right">
                    {revenueComparison.tours.share.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(revenueComparison.tours.revenue / maxRev) * 100}%` }}
                />
              </div>
            </div>

            {/* Hotels bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-trivia-500" />
                  <span className="text-sm font-medium text-slate-900">Hotels</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono font-bold text-slate-900">
                    ${revenueComparison.hotels.revenue.toFixed(0)}
                  </span>
                  <span className="text-slate-500 w-12 text-right">
                    {revenueComparison.hotels.share.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-trivia-500 rounded-full transition-all duration-500"
                  style={{ width: `${(revenueComparison.hotels.revenue / maxRev) * 100}%` }}
                />
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">Combined revenue</span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                ${revenueComparison.total.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Hotels */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Top Hotels by Revenue</h3>
          </div>

          {topHotels.length === 0 ? (
            <div className="p-8 text-center">
              <HotelIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No hotel bookings in this period</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topHotels.slice(0, 8).map((h, idx) => (
                <div key={h.hotelId} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700"
                        : idx === 1
                        ? "bg-slate-100 text-slate-700"
                        : idx === 2
                        ? "bg-orange-100 text-orange-800"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm truncate">
                      {h.hotelName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        {h.countryCode && <CountryFlag code={h.countryCode} />}
                        {h.countryName}
                      </span>
                      <span>·</span>
                      <span>
                        {h.bookingCount} booking{h.bookingCount !== 1 ? "s" : ""}
                      </span>
                      <span>·</span>
                      <span>
                        {h.totalNights} night{h.totalNights !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm flex-shrink-0">
                    ${Number(h.totalRevenue).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Hotel Booking Status</h3>
          </div>

          {pieData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No data to display</p>
            </div>
          ) : (
            <div className="p-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={STATUS_COLORS_HEX[entry.status] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px" }}
                    iconSize={8}
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── KPI CARD ────────────────────────────────

function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "default" | "blue" | "amber" | "emerald";
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
    <div className={`rounded-xl border p-4 ${accents[accent]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
          {label}
        </p>
        <Icon className={`w-4 h-4 ${iconColors[accent]}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
