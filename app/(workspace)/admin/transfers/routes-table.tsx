"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Edit2,
  Plus,
  Search,
  Power,
  PowerOff,
  Trash2,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import {
  updateRoute,
  deleteRoute,
  type TransferRouteRow,
} from "./actions";
import { RouteModal } from "./route-modal";

type Location = {
  id: string;
  name: string;
  type: string;
  countryId: string;
  countryName: string | null;
};

type Country = { id: string; code: string | null; name: string };
type Supplier = { id: string; name: string };

type Props = {
  routes: TransferRouteRow[];
  locations: Location[];
  countries: Country[];
  suppliers: Supplier[];
};

export function RoutesTable({ routes, locations, countries, suppliers }: Props) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransferRouteRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = routes.filter(
    (r) =>
      r.from_name.toLowerCase().includes(search.toLowerCase()) ||
      r.to_name.toLowerCase().includes(search.toLowerCase()) ||
      r.country_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(route: TransferRouteRow) {
    setEditing(route);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this route and all its rates?")) return;
    startTransition(async () => {
      const result = await deleteRoute(id);
      if (!result.success) alert(result.error);
    });
  }

  function handleToggleActive(route: TransferRouteRow) {
    startTransition(async () => {
      await updateRoute(route.id, {
        supplierId: route.supplier_id,
        estimatedDurationMin: route.estimated_duration_min,
        isActive: !route.is_active,
      });
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={locations.length < 2}
          className="flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          title={locations.length < 2 ? "Add at least 2 locations first" : undefined}
        >
          <Plus className="w-4 h-4" />
          Add Route
        </button>
      </div>

      {locations.length < 2 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          You need at least two active locations before creating routes.{" "}
          <Link href="/admin/transfers/locations" className="font-medium underline">
            Add locations
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            {routes.length === 0 ? (
              <>
                <p className="text-slate-400 mb-2">No routes yet</p>
                {locations.length >= 2 && (
                  <button
                    onClick={handleAdd}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    + Add your first route
                  </button>
                )}
              </>
            ) : (
              <p className="text-slate-400">No routes match your search</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Route
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Country
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="text-center px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-center px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Rates
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <span>{route.from_name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{route.to_name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {route.from_type} → {route.to_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {route.country_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {route.supplier_name ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-700">
                      {route.estimated_duration_min != null
                        ? `${route.estimated_duration_min} min`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/transfers/${route.id}/rates`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-trivia-50 text-trivia-700 text-xs font-medium hover:bg-trivia-100"
                      >
                        <DollarSign className="w-3 h-3" />
                        {route.rate_count} rate{route.rate_count !== 1 ? "s" : ""}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {route.is_active ? (
                        <span className="inline-flex px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/transfers/${route.id}/rates`}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                          title="Manage rates"
                        >
                          <DollarSign className="w-4 h-4 text-trivia-600" />
                        </Link>
                        <button
                          onClick={() => handleEdit(route)}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(route)}
                          disabled={isPending}
                          className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                          title={route.is_active ? "Deactivate" : "Activate"}
                        >
                          {route.is_active ? (
                            <PowerOff className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Power className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          disabled={isPending}
                          className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {routes.length > 0 && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          {filtered.length} of {routes.length} routes •{" "}
          {routes.filter((r) => r.is_active).length} active
        </div>
      )}

      <RouteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        countries={countries}
        locations={locations}
        suppliers={suppliers}
        existing={editing}
      />
    </>
  );
}
