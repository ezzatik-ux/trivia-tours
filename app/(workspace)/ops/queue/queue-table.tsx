"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Search,
  Users,
  Hand,
  UserCheck,
  FilterX,
  Inbox,
  Phone,
} from "lucide-react";
import { BookingStatusBadge } from "@/components/ui/booking-status-badge";
import { UrgencyBadge } from "@/components/ui/urgency-badge";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";
import { assignToMe, unassign, type OpsBooking } from "./actions";

type Props = {
  bookings: OpsBooking[];
  currentUserId: string;
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All Active" },
  { value: "UNASSIGNED", label: "Unassigned" },
  { value: "MINE", label: "My Bookings" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CONFIRMED", label: "Confirmed" },
];

export function QueueTable({ bookings, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !search ||
        b.bookingNo.toLowerCase().includes(search.toLowerCase()) ||
        b.salesOrderNo.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.productName?.toLowerCase().includes(search.toLowerCase());

      let matchesFilter = true;
      switch (filter) {
        case "UNASSIGNED":
          matchesFilter = !b.assignedOpsId;
          break;
        case "MINE":
          matchesFilter = b.assignedOpsId === currentUserId;
          break;
        case "NEW":
          matchesFilter = b.status === "NEW";
          break;
        case "IN_PROGRESS":
          matchesFilter = ["ACK", "SUPPLIER_CONTACTED"].includes(b.status);
          break;
        case "CONFIRMED":
          matchesFilter = b.status === "CONFIRMED";
          break;
        case "ALL":
        default:
          matchesFilter = true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [bookings, search, filter, currentUserId]);

  function handleAssign(bookingId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    startTransition(async () => {
      await assignToMe(bookingId);
    });
  }

  function handleUnassign(bookingId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    startTransition(async () => {
      await unassign(bookingId);
    });
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-medium mb-1">Queue is empty</p>
        <p className="text-sm text-slate-500">No active bookings to process</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by booking #, sales order, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {(search || filter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <FilterX className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                filter === f.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No bookings match your filters</p>
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
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Travel
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const isMine = b.assignedOpsId === currentUserId;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => (window.location.href = `/ops/bookings/${b.id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold text-slate-900">
                          {b.bookingNo}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          SO: {b.salesOrderNo}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{b.customerName}</div>
                        {b.customerPhone && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {b.customerPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <Users className="w-3 h-3" />
                          {b.totalPax} pax
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 line-clamp-1 max-w-[200px]">
                          {b.productName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {b.productType && <ProductTypeBadge type={b.productType} />}
                          {b.countryFlag && (
                            <span className="text-xs text-slate-500">{b.countryFlag}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">
                          {new Date(b.travelDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="mt-1">
                          <UrgencyBadge travelDate={b.travelDate} status={b.status} />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <BookingStatusBadge status={b.status} />
                      </td>

                      <td className="px-4 py-3">
                        {b.assignedOpsName ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">
                              {isMine ? "You" : b.assignedOpsName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!b.assignedOpsId ? (
                            <button
                              onClick={(e) => handleAssign(b.id, e)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Hand className="w-3.5 h-3.5" />
                              Assign to me
                            </button>
                          ) : isMine ? (
                            <button
                              onClick={(e) => handleUnassign(b.id, e)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Release
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-slate-500 mt-4">
        Showing {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
      </p>
    </>
  );
}
