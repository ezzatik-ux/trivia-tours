"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";
import { deleteCity } from "./actions";
import { CityModal } from "./city-modal";

type City = {
  id: string;
  name: string;
  code: string | null;
  countryId: string;
  countryName: string | null;
  countryCode: string | null;
  isActive: boolean;
};

type Country = { id: string; code: string | null; name: string };

export function CitiesCatalog({
  cities,
  countries,
}: {
  cities: City[];
  countries: Country[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(city: City) {
    setEditing(city);
    setModalOpen(true);
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this city?")) return;
    setDeletingId(id);
    const res = await deleteCity(id);
    setDeletingId(null);
    if (res.success) router.refresh();
    else alert(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Cities <span className="text-slate-400 font-normal">({cities.length})</span>
        </h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add city
        </button>
      </div>

      {cities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No cities yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Add cities and assign their 3-letter codes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr
                  key={city.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {city.name}
                  </td>
                  <td className="px-4 py-3">
                    {city.code ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                        {city.code}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <CountryFlag
                        code={city.countryCode}
                        name={city.countryName}
                      />
                      {city.countryName ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {city.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(city)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(city.id)}
                        disabled={deletingId === city.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        {deletingId === city.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CityModal
        open={modalOpen}
        editing={editing}
        countries={countries}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
