"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  Package2,
  TrendingUp,
  Users,
  Download,
  Trophy,
  Globe2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { BookingStatusBadge } from "@/components/ui/booking-status-badge";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";
import { StatusChart } from "./status-chart";
import { RevenueChart } from "./revenue-chart";
import { CountryChart } from "./country-chart";
import { CountryFlag } from "@/components/ui/country-flag";
import { exportBookings, type DateRange } from "./actions";

const RANGES: Array<{ value: DateRange; label: string }> = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "quarter", label: "Last 3 months" },
  { value: "year", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

type Props = {
  range: DateRange;
  kpi: {
    revenue: number;
    bookingCount: number;
    avgValue: number;
    totalPax: number;
    revenueChange: number;
    bookingChange: number;
    avgValueChange: number;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  revenueTrend: Array<{ month: string; revenue: number; bookings: number }>;
  topCountries: Array<{
    countryName: string | null;
    countryCode: string | null;
    bookings: number;
    revenue: number;
  }>;
  topAgents: Array<{
    agentId: string;
    agentName: string | null;
    agentEmail: string | null;
    bookings: number;
    revenue: number;
    totalPax: number;
  }>;
  topProducts: Array<{
    productName: string | null;
    productType: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER" | null;
    countryCode: string | null;
    bookings: number;
    revenue: number;
  }>;
  upcomingTravel: Array<{
    id: string;
    bookingNo: string;
    customerName: string;
    travelDate: string;
    totalPax: number;
    status: "NEW" | "ACK" | "SUPPLIER_CONTACTED" | "CONFIRMED" | "VOUCHER_ISSUED" | "OPERATED" | "CLOSED" | "CANCELLED";
    productName: string | null;
    productType: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER" | null;
    countryCode: string | null;
  }>;
  canExport: boolean;
  children?: React.ReactNode;
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function AnalyticsView(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exporting, startExporting] = useTransition();

  function handleRangeChange(newRange: DateRange) {
    const params = new URLSearchParams(searchParams);
    params.set("range", newRange);
    router.push(`?${params.toString()}`);
  }

  async function handleExport() {
    startExporting(async () => {
      const data = await exportBookings(props.range);

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((h) => {
              const value = (row as Record<string, unknown>)[h];
              if (value === null || value === undefined) return "";
              const str = String(value);
              return str.includes(",") || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(",")
        ),
      ];

      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bookings-${props.range}-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header with date range + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Business performance and insights</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={props.range}
            onChange={(e) => handleRangeChange(e.target.value as DateRange)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {props.canExport && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(props.kpi.revenue)}
          change={props.range !== "all" ? props.kpi.revenueChange : undefined}
          icon={DollarSign}
          variant="emerald"
        />
        <KpiCard
          label="Bookings"
          value={props.kpi.bookingCount.toString()}
          change={props.range !== "all" ? props.kpi.bookingChange : undefined}
          icon={Package2}
          variant="blue"
        />
        <KpiCard
          label="Avg Booking Value"
          value={formatCurrency(props.kpi.avgValue)}
          change={props.range !== "all" ? props.kpi.avgValueChange : undefined}
          icon={TrendingUp}
        />
        <KpiCard
          label="Total Passengers"
          value={props.kpi.totalPax.toString()}
          icon={Users}
          variant="amber"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Status Distribution" icon={Package2}>
          <StatusChart data={props.statusDistribution} />
        </ChartCard>

        <ChartCard title="Revenue Trend (12 months)" icon={TrendingUp}>
          <RevenueChart data={props.revenueTrend} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top Countries" icon={Globe2}>
          <CountryChart data={props.topCountries} />
        </ChartCard>

        <ChartCard title="Top Sales Agents" icon={Trophy}>
          <AgentsLeaderboard agents={props.topAgents} />
        </ChartCard>
      </div>

      {/* Top products */}
      <ChartCard title="Top Products" icon={Package2}>
        <ProductsTable products={props.topProducts} />
      </ChartCard>

      {/* Upcoming travel */}
      <ChartCard title="Upcoming Travel (Next 7 Days)" icon={Calendar}>
        <UpcomingTravelTable bookings={props.upcomingTravel} />
      </ChartCard>

      {props.children}
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function AgentsLeaderboard({ agents }: { agents: Props["topAgents"] }) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No agent activity yet
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {agents.map((agent, idx) => (
        <li
          key={agent.agentId}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              idx === 0
                ? "bg-amber-100 text-amber-700"
                : idx === 1
                ? "bg-slate-200 text-slate-700"
                : idx === 2
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{agent.agentName || agent.agentEmail || "Unknown"}</p>
            <p className="text-xs text-slate-500">
              {agent.bookings} booking{agent.bookings !== 1 ? "s" : ""} · {agent.totalPax} pax
            </p>
          </div>
          <p className="font-bold text-slate-900 font-mono text-sm">
            {formatCurrency(agent.revenue)}
          </p>
        </li>
      ))}
    </ol>
  );
}

function ProductsTable({ products }: { products: Props["topProducts"] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">No products booked yet</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Product
            </th>
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Type
            </th>
            <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bookings
            </th>
            <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((p, idx) => (
            <tr key={idx}>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {p.countryCode && <CountryFlag code={p.countryCode} />}
                  <span className="font-medium text-slate-900">{p.productName}</span>
                </div>
              </td>
              <td className="py-3">
                {p.productType && <ProductTypeBadge type={p.productType} />}
              </td>
              <td className="py-3 text-right font-medium text-slate-700">{p.bookings}</td>
              <td className="py-3 text-right font-mono font-semibold text-slate-900">
                {formatCurrency(p.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpcomingTravelTable({ bookings }: { bookings: Props["upcomingTravel"] }) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No travel scheduled in next 7 days
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Date
            </th>
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Booking
            </th>
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Product
            </th>
            <th className="text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pax
            </th>
            <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <tr
              key={b.id}
              onClick={() => (window.location.href = `/bookings/${b.id}`)}
              className="hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <td className="py-3 font-medium text-slate-900">
                {new Date(b.travelDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-3 font-mono text-xs">{b.bookingNo}</td>
              <td className="py-3 text-slate-700">{b.customerName}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {b.countryCode && <CountryFlag code={b.countryCode} />}
                  <span className="text-slate-700 truncate max-w-[200px]">{b.productName}</span>
                </div>
              </td>
              <td className="py-3 text-center text-slate-700">{b.totalPax}</td>
              <td className="py-3">
                <BookingStatusBadge status={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
