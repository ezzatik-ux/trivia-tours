"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, MapPin } from "lucide-react";
import { createLocation, updateLocation, type LocationType } from "./actions";

type Country = { id: string; code: string | null; name: string };
type Editing = {
  id: string;
  name: string;
  type: LocationType;
  countryId: string;
  cityName: string | null;
  code: string | null;
  isActive: boolean;
} | null;

type Props = { open: boolean; onClose: () => void; countries: Country[]; editing: Editing };

const TYPES: { value: LocationType; label: string }[] = [
  { value: "AIRPORT", label: "Airport" },
  { value: "HOTEL", label: "Hotel" },
  { value: "CITY", label: "City" },
  { value: "ZONE", label: "Zone / Area" },
  { value: "LANDMARK", label: "Landmark" },
  { value: "PORT", label: "Port" },
];

export function LocationFormModal({ open, onClose, countries, editing }: Props) {
  const router = useRouter();
  const isEdit = !!editing;
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("AIRPORT");
  const [countryId, setCountryId] = useState("");
  const [cityName, setCityName] = useState("");
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setType(editing?.type ?? "AIRPORT");
      setCountryId(editing?.countryId ?? countries[0]?.id ?? "");
      setCityName(editing?.cityName ?? "");
      setCode(editing?.code ?? "");
      setIsActive(editing?.isActive ?? true);
      setError(null);
    }
  }, [open, editing, countries]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    if (!countryId) return setError("Country is required");
    startTransition(async () => {
      const payload = { name, type, countryId, cityName: cityName || null, code: code || null };
      const result = isEdit
        ? await updateLocation(editing!.id, { ...payload, isActive })
        : await createLocation(payload);
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error || "Failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50">
      <div className="bg-white md:rounded-2xl rounded-t-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-trivia-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Location" : "Add Location"}
            </h2>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hurghada International Airport"
              disabled={isPending}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LocationType)}
                disabled={isPending}
                className="form-input"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                disabled={isPending}
                className="form-input"
              >
                <option value="">Select…</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                City / Area
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Sahl Hasheesh"
                disabled={isPending}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Code <span className="text-slate-400 normal-case">(airports)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. HRG"
                disabled={isPending}
                className="form-input uppercase"
              />
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isPending} />
              Active
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="px-5 py-2.5 text-sm font-semibold text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save" : "Add Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
