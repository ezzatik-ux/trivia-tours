"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createRoute, updateRoute, type TransferRouteRow } from "./actions";

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
  open: boolean;
  onClose: () => void;
  countries: Country[];
  locations: Location[];
  suppliers: Supplier[];
  existing: TransferRouteRow | null;
};

export function RouteModal({
  open,
  onClose,
  countries,
  locations,
  suppliers,
  existing,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [countryId, setCountryId] = useState(existing?.country_id ?? countries[0]?.id ?? "");
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const isEditing = !!existing;

  const countryLocations = locations.filter((l) => l.countryId === countryId);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    if (isEditing) {
      const input = {
        supplierId: (fd.get("supplierId") as string) || null,
        estimatedDurationMin: fd.get("estimatedDurationMin")
          ? parseInt(fd.get("estimatedDurationMin") as string, 10)
          : null,
        isActive,
      };

      startTransition(async () => {
        const result = await updateRoute(existing!.id, input);
        if (result.success) onClose();
        else setError(result.error || "Something went wrong");
      });
      return;
    }

    const input = {
      countryId: fd.get("countryId") as string,
      fromLocationId: fd.get("fromLocationId") as string,
      toLocationId: fd.get("toLocationId") as string,
      supplierId: (fd.get("supplierId") as string) || null,
      estimatedDurationMin: fd.get("estimatedDurationMin")
        ? parseInt(fd.get("estimatedDurationMin") as string, 10)
        : null,
    };

    startTransition(async () => {
      const result = await createRoute(input);
      if (result.success) onClose();
      else setError(result.error || "Something went wrong");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditing ? "Edit Route" : "Add Route"}
          </h2>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {isEditing ? (
            <>
              <div className="bg-slate-50 rounded-xl p-4 text-sm">
                <p className="font-medium text-slate-900">
                  {existing!.from_name} → {existing!.to_name}
                </p>
                <p className="text-slate-500 mt-1">{existing!.country_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
                <select
                  name="supplierId"
                  defaultValue={existing!.supplier_id ?? ""}
                  className="form-input bg-white"
                  disabled={isPending}
                >
                  <option value="">— No supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Est. Duration (minutes)
                </label>
                <input
                  name="estimatedDurationMin"
                  type="number"
                  min="1"
                  defaultValue={existing!.estimated_duration_min ?? ""}
                  placeholder="e.g. 25"
                  className="form-input"
                  disabled={isPending}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isPending}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
              </label>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="countryId"
                  required
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="form-input bg-white"
                  disabled={isPending}
                >
                  <option value="">-- Select --</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    From <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fromLocationId"
                    required
                    className="form-input bg-white"
                    disabled={isPending || !countryId}
                  >
                    <option value="">-- Select --</option>
                    {countryLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    To <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="toLocationId"
                    required
                    className="form-input bg-white"
                    disabled={isPending || !countryId}
                  >
                    <option value="">-- Select --</option>
                    {countryLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
                <select name="supplierId" className="form-input bg-white" disabled={isPending}>
                  <option value="">— No supplier —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Est. Duration (minutes)
                </label>
                <input
                  name="estimatedDurationMin"
                  type="number"
                  min="1"
                  placeholder="e.g. 25"
                  className="form-input"
                  disabled={isPending}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
