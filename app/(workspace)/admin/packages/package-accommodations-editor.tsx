"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Check, Hotel } from "lucide-react";
import { saveAccommodations, type AccommodationInput } from "./actions";

type BoardBasis = "RO" | "BB" | "HB" | "FB" | "AI";

const BOARD_BASIS_OPTIONS: Array<{ value: BoardBasis; label: string }> = [
  { value: "RO", label: "Room Only" },
  { value: "BB", label: "Bed & Breakfast" },
  { value: "HB", label: "Half Board" },
  { value: "FB", label: "Full Board" },
  { value: "AI", label: "All Inclusive" },
];

type AccRow = {
  id?: string; // DB id for existing rows; undefined for new (unsaved) rows
  clientKey: string; // stable React key
  hotelName: string;
  cityName: string;
  nights: number;
  boardBasis: BoardBasis;
  startDate: string;
};

type InitialItem = {
  id?: string;
  hotelName: string;
  cityName?: string | null;
  nights: number;
  boardBasis: BoardBasis;
  startDate?: string | null;
};

type Props = {
  packageId: string;
  initialItems: InitialItem[];
};

export function PackageAccommodationsEditor({ packageId, initialItems }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<AccRow[]>(
    initialItems.map((it) => ({
      id: it.id,
      clientKey: it.id ?? crypto.randomUUID(),
      hotelName: it.hotelName ?? "",
      cityName: it.cityName ?? "",
      nights: it.nights ?? 1,
      boardBasis: it.boardBasis ?? "BB",
      startDate: it.startDate ?? "",
    }))
  );

  function updateItem(index: number, patch: Partial<AccRow>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    setSaved(false);
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      {
        id: undefined,
        clientKey: crypto.randomUUID(),
        hotelName: "",
        cityName: "",
        nights: 1,
        boardBasis: "BB",
        startDate: "",
      },
    ]);
    setSaved(false);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
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

    for (const it of items) {
      if (!it.hotelName.trim()) {
        setError("Every hotel needs a name");
        return;
      }
      if (!Number.isFinite(it.nights) || it.nights < 1) {
        setError("Nights must be at least 1");
        return;
      }
    }

    startTransition(async () => {
      const payload: AccommodationInput[] = items.map((it) => ({
        id: it.id,
        hotelName: it.hotelName,
        cityName: it.cityName || null,
        nights: it.nights,
        boardBasis: it.boardBasis,
        startDate: it.startDate || null,
      }));

      const result = await saveAccommodations(packageId, payload);

      if (result.success) {
        // Re-hydrate by order: returned items are ordered by sortOrder, matching
        // the array order we sent. Each local row picks up its saved id while
        // keeping its stable clientKey.
        const returned = result.items ?? [];
        setItems((prev) =>
          prev.map((row, i) => {
            const savedRow = returned[i];
            if (!savedRow) return row;
            return {
              ...row,
              id: savedRow.id,
              hotelName: savedRow.hotelName,
              cityName: savedRow.cityName ?? "",
              nights: savedRow.nights,
              boardBasis: savedRow.boardBasis as BoardBasis,
              startDate: savedRow.startDate ?? "",
            };
          })
        );
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error || "Failed to save accommodations");
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-trivia-600" />
            <h3 className="text-base font-semibold text-slate-900">Accommodations</h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Hotels in stay order. Board basis and nights per hotel.
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add hotel
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-600 font-medium">No hotels yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Add hotels to build the accommodation plan, or save empty to clear it.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.clientKey}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-trivia-50 text-trivia-700 border border-trivia-200">
                  Hotel {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveRow(index, -1)}
                    disabled={isPending || index === 0}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(index, 1)}
                    disabled={isPending || index === items.length - 1}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
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
                  Hotel name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.hotelName}
                  onChange={(e) => updateItem(index, { hotelName: e.target.value })}
                  placeholder="e.g., The Mulia Resort"
                  disabled={isPending}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Destination / city
                  </label>
                  <input
                    type="text"
                    value={item.cityName}
                    onChange={(e) => updateItem(index, { cityName: e.target.value })}
                    placeholder="e.g., Nusa Dua"
                    disabled={isPending}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nights <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.nights}
                    onChange={(e) =>
                      updateItem(index, { nights: Number(e.target.value) })
                    }
                    disabled={isPending}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Board basis
                  </label>
                  <select
                    value={item.boardBasis}
                    onChange={(e) =>
                      updateItem(index, { boardBasis: e.target.value as BoardBasis })
                    }
                    disabled={isPending}
                    className="form-input"
                  >
                    {BOARD_BASIS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start date (optional)
                  </label>
                  <input
                    type="date"
                    value={item.startDate}
                    onChange={(e) => updateItem(index, { startDate: e.target.value })}
                    disabled={isPending}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        {saved && !isPending && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <Check className="w-4 h-4" />
            Accommodations saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save accommodations
        </button>
      </div>
    </div>
  );
}
