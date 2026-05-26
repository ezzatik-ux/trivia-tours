"use client";

import { useState, useTransition } from "react";
import { Edit2, Plus, Search, Power, PowerOff, Trash2 } from "lucide-react";
import { updateLocation, deleteLocation, type LocationType } from "./actions";
import { LocationFormModal } from "./location-form-modal";

type Country = { id: string; code: string | null; name: string };

type Location = {
  id: string;
  name: string;
  type: LocationType;
  cityName: string | null;
  code: string | null;
  isActive: boolean;
  countryId: string;
  countryName: string | null;
};

type Props = {
  locations: Location[];
  countries: Country[];
};

export function LocationsTable({ locations, countries }: Props) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.cityName?.toLowerCase().includes(search.toLowerCase()) ||
      l.code?.toLowerCase().includes(search.toLowerCase()) ||
      l.countryName?.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(loc: Location) {
    setEditing(loc);
    setModalOpen(true);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete location "${name}"? This may fail if used by a route.`)) return;
    startTransition(async () => {
      const result = await deleteLocation(id);
      if (!result.success) alert(result.error);
    });
  }

  function handleToggleActive(loc: Location) {
    startTransition(async () => {
      await updateLocation(loc.id, {
        name: loc.name,
        type: loc.type,
        countryId: loc.countryId,
        cityName: loc.cityName,
        code: loc.code,
        isActive: !loc.isActive,
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
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            {locations.length === 0 ? (
              <>
                <p className="text-slate-400 mb-2">No locations yet</p>
                <button
                  onClick={handleAdd}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  + Add your first location
                </button>
              </>
            ) : (
              <p className="text-slate-400">No locations match your search</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Country
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Code
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
              {filtered.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{loc.name}</div>
                    {loc.cityName && (
                      <div className="text-xs text-slate-500 mt-0.5">{loc.cityName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {loc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {loc.countryName ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-700">
                    {loc.code ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {loc.isActive ? (
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
                      <button
                        onClick={() => handleEdit(loc)}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(loc)}
                        disabled={isPending}
                        className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                        title={loc.isActive ? "Deactivate" : "Activate"}
                      >
                        {loc.isActive ? (
                          <PowerOff className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Power className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
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
        )}
      </div>

      {locations.length > 0 && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          {filtered.length} of {locations.length} locations •{" "}
          {locations.filter((l) => l.isActive).length} active
        </div>
      )}

      <LocationFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        countries={countries}
        editing={editing}
      />
    </>
  );
}
