"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Edit2,
  Power,
  PowerOff,
  Trash2,
  Copy,
  DollarSign,
  Filter,
} from "lucide-react";
import { RateModal } from "./rate-modal";
import { toggleRateActive, deleteRate, duplicateRate } from "./rates-actions";

type RoomType = {
  id: string;
  name: string;
};

type Season = {
  id: string;
  name: string;
  validFrom: string;
  validTo: string;
};

type Rate = {
  id: string;
  roomTypeId: string;
  seasonId: string | null;
  validFrom: string;
  validTo: string;
  netSingle: string | null;
  netDouble: string;
  netTriple: string | null;
  netQuad: string | null;
  markupPct: string | null;
  commissionPct: string | null;
  sellSingle: string | null;
  sellDouble: string | null;
  sellTriple: string | null;
  sellQuad: string | null;
  mealPlan: "RO" | "BB" | "HB" | "FB" | "AI";
  childAgeMin: number | null;
  childAgeMax: number | null;
  childRate: string | null;
  childMealSupplement: string | null;
  earlyBirdDays: number | null;
  earlyBirdPct: string | null;
  minNights: number | null;
  maxNights: number | null;
  originalCurrency: string | null;
  exchangeRateAtUpload: string | null;
  isActive: boolean;
  roomTypeName: string | null;
  seasonName: string | null;
};

type Props = {
  hotelId: string;
  rates: Rate[];
  roomTypes: RoomType[];
  seasons: Season[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function formatMoney(amount: string | null) {
  if (!amount) return "$0.00";
  return `$${parseFloat(amount).toFixed(2)}`;
}

const MEAL_PLAN_COLORS: Record<string, string> = {
  RO: "bg-slate-100 text-slate-700",
  BB: "bg-blue-100 text-blue-700",
  HB: "bg-amber-100 text-amber-700",
  FB: "bg-orange-100 text-orange-700",
  AI: "bg-purple-100 text-purple-700",
};

export function RatesTable({ hotelId, rates, roomTypes, seasons }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rate | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [roomFilter, setRoomFilter] = useState<string>("ALL");
  const [seasonFilter, setSeasonFilter] = useState<string>("ALL");
  const [activeOnly, setActiveOnly] = useState(false);

  const filtered = useMemo(() => {
    return rates.filter((r) => {
      if (roomFilter !== "ALL" && r.roomTypeId !== roomFilter) return false;
      if (seasonFilter !== "ALL" && r.seasonId !== seasonFilter) return false;
      if (activeOnly && !r.isActive) return false;
      return true;
    });
  }, [rates, roomFilter, seasonFilter, activeOnly]);

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(r: Rate) {
    setEditing(r);
    setModalOpen(true);
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleRateActive(id, !currentlyActive, hotelId);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this rate? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteRate(id, hotelId);
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      await duplicateRate(id, hotelId);
    });
  }

  // Map rate to modal input format
  const editingForModal = editing
    ? {
        id: editing.id,
        hotelId,
        roomTypeId: editing.roomTypeId,
        seasonId: editing.seasonId,
        validFrom: editing.validFrom,
        validTo: editing.validTo,
        netSingle: editing.netSingle ? parseFloat(editing.netSingle) : 0,
        netDouble: parseFloat(editing.netDouble),
        netTriple: editing.netTriple ? parseFloat(editing.netTriple) : 0,
        netQuad: editing.netQuad ? parseFloat(editing.netQuad) : 0,
        markupPct: editing.markupPct ? parseFloat(editing.markupPct) : 0,
        commissionPct: editing.commissionPct ? parseFloat(editing.commissionPct) : 0,
        mealPlan: editing.mealPlan,
        childAgeMin: editing.childAgeMin,
        childAgeMax: editing.childAgeMax,
        childRate: editing.childRate ? parseFloat(editing.childRate) : 0,
        childMealSupplement: editing.childMealSupplement ? parseFloat(editing.childMealSupplement) : 0,
        earlyBirdDays: editing.earlyBirdDays,
        earlyBirdPct: editing.earlyBirdPct ? parseFloat(editing.earlyBirdPct) : null,
        minNights: editing.minNights,
        maxNights: editing.maxNights,
        originalCurrency: editing.originalCurrency,
        exchangeRateAtUpload: editing.exchangeRateAtUpload ? parseFloat(editing.exchangeRateAtUpload) : 1,
        isActive: editing.isActive,
      }
    : null;

  if (roomTypes.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="font-medium text-amber-900 mb-2">No room types defined yet</p>
        <p className="text-sm text-amber-700">
          You need to add room types before you can create rates. Go to the &quot;Room Types&quot; tab first.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rates Matrix</h2>
          <p className="text-sm text-slate-500">
            Pricing for every room type × season combination
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Rate
        </button>
      </div>

      {/* Filters */}
      {rates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm"
          >
            <option value="ALL">All Room Types</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-sm"
          >
            <option value="ALL">All Seasons</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="">No Season</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            Active only
          </label>
          <span className="ml-auto text-xs text-slate-500">
            Showing {filtered.length} of {rates.length}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            {rates.length === 0 ? (
              <>
                <p className="text-slate-600 font-medium mb-1">No rates yet</p>
                <p className="text-sm text-slate-400 mb-4">
                  Create your first rate to start pricing this hotel
                </p>
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add first rate
                </button>
              </>
            ) : (
              <p className="text-slate-600">No rates match your filters</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Room / Season
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Meal
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Net (S/D/T/Q)
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Markup/Comm
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Sell (S/D/T/Q)
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const isCommission = parseFloat(r.commissionPct ?? "0") > 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.roomTypeName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {r.seasonName || <span className="italic">No season</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="text-xs">
                          {formatDate(r.validFrom)} → {formatDate(r.validTo)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            MEAL_PLAN_COLORS[r.mealPlan] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.mealPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">
                        <div>{formatMoney(r.netSingle)}</div>
                        <div className="font-semibold">{formatMoney(r.netDouble)}</div>
                        <div>{formatMoney(r.netTriple)}</div>
                        <div>{formatMoney(r.netQuad)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isCommission ? (
                          <div>
                            <div className="font-medium text-slate-900">
                              {parseFloat(r.commissionPct ?? "0").toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-slate-500">commission</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900">
                              {parseFloat(r.markupPct ?? "0").toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-slate-500">markup</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        <div className="text-emerald-700">{formatMoney(r.sellSingle)}</div>
                        <div className="text-emerald-900 font-semibold">{formatMoney(r.sellDouble)}</div>
                        <div className="text-emerald-700">{formatMoney(r.sellTriple)}</div>
                        <div className="text-emerald-700">{formatMoney(r.sellQuad)}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(r.id)}
                            disabled={isPending}
                            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                            title="Duplicate rate"
                          >
                            <Copy className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleToggle(r.id, r.isActive)}
                            disabled={isPending}
                            className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                            title={r.isActive ? "Deactivate" : "Activate"}
                          >
                            {r.isActive ? (
                              <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Power className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={isPending}
                            className="p-1.5 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
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

      <RateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        hotelId={hotelId}
        roomTypes={roomTypes}
        seasons={seasons}
        existing={editingForModal}
      />
    </>
  );
}
