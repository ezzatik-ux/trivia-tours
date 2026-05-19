"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Hotel as HotelIcon,
  ArrowRight,
  Hand,
  Clock,
} from "lucide-react";
import { assignHotelBookingToSelf } from "./actions";

type Booking = {
  id: string;
  bookingNo: string;
  customerName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  numRooms: number;
  occupancy: string;
  totalPrice: string;
  status: string;
  assignedOpsId: string | null;
  createdAt: Date;
  hotelName: string | null;
  hotelBrand: string | null;
  countryName: string | null;
  countryFlag: string | null;
  roomTypeName: string | null;
  salesAgentName: string | null;
  assignedOpsName: string | null;
};

type Props = {
  bookings: Booking[];
  currentUserId: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  NEW: { label: "New", color: "text-red-700", bgColor: "bg-red-100" },
  ACK: { label: "Acknowledged", color: "text-blue-700", bgColor: "bg-blue-100" },
  HOTEL_CONTACTED: { label: "Hotel Contacted", color: "text-amber-700", bgColor: "bg-amber-100" },
  AWAITING_INVOICE: { label: "Awaiting Invoice", color: "text-purple-700", bgColor: "bg-purple-100" },
  CONFIRMED: { label: "Confirmed", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  VOUCHER_ISSUED: { label: "Voucher Issued", color: "text-teal-700", bgColor: "bg-teal-100" },
  CHECKED_IN: { label: "Checked In", color: "text-cyan-700", bgColor: "bg-cyan-100" },
  CHECKED_OUT: { label: "Checked Out", color: "text-slate-700", bgColor: "bg-slate-200" },
  COMPLETED: { label: "Completed", color: "text-slate-700", bgColor: "bg-slate-100" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-50" },
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HotelQueueTable({ bookings, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      const matchesSearch =
        !search ||
        b.bookingNo.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.hotelName?.toLowerCase().includes(search.toLowerCase());

      // Status
      const isActive = !["COMPLETED", "CANCELLED", "CHECKED_OUT"].includes(b.status);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && isActive) ||
        (statusFilter === "DONE" && !isActive) ||
        b.status === statusFilter;

      // Assignment
      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "MINE" && b.assignedOpsId === currentUserId) ||
        (assignmentFilter === "UNASSIGNED" && !b.assignedOpsId);

      return matchesSearch && matchesStatus && matchesAssignment;
    });
  }, [bookings, search, statusFilter, assignmentFilter, currentUserId]);

  // Smart sort: urgency based on check-in date + status
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // NEW status first
      if (a.status === "NEW" && b.status !== "NEW") return -1;
      if (b.status === "NEW" && a.status !== "NEW") return 1;
      // Then by check-in date (sooner first)
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
    });
  }, [filtered]);

  const stats = useMemo(() => ({
    total: bookings.length,
    new: bookings.filter((b) => b.status === "NEW").length,
    inProgress: bookings.filter((b) =>
      ["ACK", "HOTEL_CONTACTED", "AWAITING_INVOICE"].includes(b.status)
    ).length,
    confirmed: bookings.filter((b) =>
      ["CONFIRMED", "VOUCHER_ISSUED", "CHECKED_IN"].includes(b.status)
    ).length,
    mine: bookings.filter((b) => b.assignedOpsId === currentUserId).length,
  }), [bookings, currentUserId]);

  function handleAssign(bookingId: string) {
    startTransition(async () => {
      await assignHotelBookingToSelf(bookingId);
    });
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="New" value={stats.new} color="red" />
        <StatPill label="In Progress" value={stats.inProgress} color="amber" />
        <StatPill label="Confirmed" value={stats.confirmed} color="emerald" />
        <StatPill label="My Assignments" value={stats.mine} color="blue" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by booking #, customer, or hotel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
          >
            <option value="ACTIVE">Active bookings</option>
            <option value="DONE">Completed/Cancelled</option>
            <option value="ALL">All</option>
            <option value="NEW">New only</option>
            <option value="HOTEL_CONTACTED">Hotel Contacted</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="VOUCHER_ISSUED">Voucher Issued</option>
          </select>

          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
          >
            <option value="ALL">All bookings</option>
            <option value="MINE">My assignments</option>
            <option value="UNASSIGNED">Unassigned</option>
          </select>

          <span className="ml-auto text-sm text-slate-500">
            {sorted.length} of {bookings.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-16 text-center">
            <HotelIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No hotel bookings match your filters</p>
            <p className="text-sm text-slate-400">
              {bookings.length === 0
                ? "Sales agents will create bookings that appear here"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Booking
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Hotel
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Stay
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Assigned
                </th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Total
                </th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((b) => {
                const status = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.NEW;
                const isMine = b.assignedOpsId === currentUserId;
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-slate-900 text-xs">
                        {b.bookingNo}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(b.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{b.customerName}</div>
                      <div className="text-xs text-slate-500">
                        by {b.salesAgentName?.split(" ")[0] ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 line-clamp-1">{b.hotelName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {b.countryFlag} {b.roomTypeName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="text-xs">
                        {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {b.nights}n · {b.numRooms} room{b.numRooms > 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${status.color} ${status.bgColor}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.assignedOpsName ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isMine ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span className={isMine ? "font-semibold text-slate-900" : "text-slate-600"}>
                            {isMine ? "You" : b.assignedOpsName.split(" ")[0]}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAssign(b.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-trivia-700 bg-trivia-50 hover:bg-trivia-100 rounded-md disabled:opacity-50"
                        >
                          <Hand className="w-3 h-3" />
                          Claim
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      ${Number(b.totalPrice).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/ops/hotel-bookings/${b.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-trivia-700 hover:bg-trivia-50 rounded-md"
                      >
                        Open
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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
  color?: "default" | "red" | "amber" | "emerald" | "blue";
}) {
  const colors = {
    default: "bg-white border-slate-200 text-slate-900",
    red: "bg-red-50 border-red-200 text-red-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
