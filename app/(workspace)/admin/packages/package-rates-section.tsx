"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { deletePackageRate } from "./actions";
import {
  PackageRateModal,
  type PackageRateRow,
} from "./package-rate-modal";

type Props = {
  packageId: string;
  initialRates: PackageRateRow[];
};

function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

export function PackageRatesSection({ packageId, initialRates }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PackageRateRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(rate: PackageRateRow) {
    setEditing(rate);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this rate?")) return;
    setDeletingId(id);
    const res = await deletePackageRate(id);
    setDeletingId(null);
    if (res.success) router.refresh();
    else alert(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Rates{" "}
          <span className="text-slate-400 font-normal">
            ({initialRates.length})
          </span>
        </h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add rate
        </button>
      </div>

      {initialRates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No rates yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Add a cost + markup rate with a validity window.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialRates.map((rate) => (
            <div
              key={rate.id}
              className={`bg-white rounded-2xl border p-4 space-y-3 ${
                rate.isActive
                  ? "border-slate-200"
                  : "border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {rate.label?.trim() || "Standard"}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {rate.validFrom} → {rate.validTo}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    rate.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {rate.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Net / markup
                  </p>
                  <p className="text-slate-800 mt-0.5">
                    {formatMoney(rate.netAdult)} / {formatMoney(rate.netChild)}
                  </p>
                  <p className="text-xs text-slate-500">
                    +{parseFloat(rate.markupPct).toFixed(0)}%
                  </p>
                </div>
                <div className="rounded-lg bg-trivia-50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-trivia-700 font-semibold">
                    Sell
                  </p>
                  <p className="text-slate-900 font-medium mt-0.5">
                    {formatMoney(rate.sellAdult)} / {formatMoney(rate.sellChild)}
                  </p>
                  <p className="text-xs text-slate-500">adult / child</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                {rate.minPax ?? 1}
                {rate.maxPax != null ? `–${rate.maxPax}` : "+"} pax · child ages{" "}
                {rate.childAgeMin ?? 2}–{rate.childAgeMax ?? 11}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openEdit(rate)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rate.id)}
                  disabled={deletingId === rate.id}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                >
                  {deletingId === rate.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PackageRateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        packageId={packageId}
        editing={editing}
      />
    </div>
  );
}
