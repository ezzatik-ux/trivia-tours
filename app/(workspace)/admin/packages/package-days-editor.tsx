"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  CalendarDays,
} from "lucide-react";
import { savePackageDays, type PackageDayInput } from "./actions";

type DayRow = {
  id?: string; // DB id for existing days; undefined for new (unsaved) days
  clientKey: string; // stable React key + tracking
  title: string;
  description: string;
  locationName: string;
};

type Props = {
  packageId: string;
  initialDays: PackageDayInput[];
};

export function PackageDaysEditor({ packageId, initialDays }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [days, setDays] = useState<DayRow[]>(
    initialDays.map((d) => ({
      id: d.id,
      clientKey: d.id ?? crypto.randomUUID(),
      title: d.title ?? "",
      description: d.description ?? "",
      locationName: d.locationName ?? "",
    }))
  );

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
    setSaved(false);
  }

  function addDay() {
    setDays((prev) => [
      ...prev,
      {
        id: undefined,
        clientKey: crypto.randomUUID(),
        title: "",
        description: "",
        locationName: "",
      },
    ]);
    setSaved(false);
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function moveDay(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= days.length) return;
    setDays((prev) => {
      const next = [...prev];
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    setSaved(false);

    for (const day of days) {
      if (!day.title.trim()) {
        setError("Every day needs a title");
        return;
      }
    }

    startTransition(async () => {
      const result = await savePackageDays(
        packageId,
        days.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description || null,
          locationName: d.locationName || null,
        }))
      );

      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error || "Failed to save itinerary");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-trivia-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Itinerary
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Day-by-day plan. Order is saved as Day 1, Day 2… on save.
          </p>
        </div>
        <button
          type="button"
          onClick={addDay}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add day
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-600 font-medium">No days yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Add days to build the itinerary, or save empty to clear it.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day, index) => (
            <div
              key={day.clientKey}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-trivia-50 text-trivia-700 border border-trivia-200">
                  Day {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveDay(index, -1)}
                    disabled={isPending || index === 0}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDay(index, 1)}
                    disabled={isPending || index === days.length - 1}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDay(index)}
                    disabled={isPending}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateDay(index, { title: e.target.value })}
                  placeholder="e.g., Arrival in Cairo & Pyramids"
                  disabled={isPending}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={day.description}
                  onChange={(e) =>
                    updateDay(index, { description: e.target.value })
                  }
                  placeholder="What happens on this day…"
                  disabled={isPending}
                  rows={3}
                  className="form-input resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={day.locationName}
                  onChange={(e) =>
                    updateDay(index, { locationName: e.target.value })
                  }
                  placeholder="e.g., Giza"
                  disabled={isPending}
                  className="form-input"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        {saved && !isPending && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check className="w-4 h-4" />
            Itinerary saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save itinerary
        </button>
      </div>
    </div>
  );
}
