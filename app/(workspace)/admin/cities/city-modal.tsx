"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, MapPin } from "lucide-react";
import { countryFlagEmoji } from "@/components/ui/country-flag";
import { createCity, updateCity } from "./actions";

type City = {
  id: string;
  name: string;
  code: string | null;
  countryId: string;
  isActive: boolean;
} | null;

type Country = { id: string; code: string | null; name: string };

type Props = {
  open: boolean;
  editing: City;
  countries: Country[];
  onClose: () => void;
};

export function CityModal({ open, editing, countries, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!editing;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [countryId, setCountryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setCode(editing?.code ?? "");
      setCountryId(editing?.countryId ?? "");
      setIsActive(editing?.isActive ?? true);
      setError(null);
    }
  }, [open, editing]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    if (!countryId) return setError("Country is required");

    startTransition(async () => {
      const payload = {
        name,
        countryId,
        code: code || null,
      };
      const res = isEdit
        ? await updateCity(editing!.id, { ...payload, isActive })
        : await createCity(payload);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed");
      }
    });
  }

  const fieldCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-trivia-200 focus:border-trivia-400";
  const labelCls =
    "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50">
      <div className="bg-white md:rounded-2xl rounded-t-3xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-trivia-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit City" : "Add City"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cairo"
              disabled={isPending}
              className={fieldCls}
            />
          </div>

          <div>
            <label className={labelCls}>Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="CAI"
              disabled={isPending}
              className={`${fieldCls} font-mono uppercase`}
            />
            <p className="text-xs text-slate-500 mt-1">
              3-letter code, e.g. CAI (optional)
            </p>
          </div>

          <div>
            <label className={labelCls}>
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              disabled={isPending}
              className={`${fieldCls} bg-white`}
            >
              <option value="">-- Select Country --</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {countryFlagEmoji(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
              />
              Active
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
              className="px-5 py-2.5 text-sm font-semibold text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save" : "Add City"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
