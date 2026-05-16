"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Power, PowerOff, Trash2, DollarSign } from "lucide-react";
import { RateFormModal } from "./rate-form-modal";
import { toggleRateActive, deleteRate } from "./rates-actions";

type Supplier = {
  id: string;
  name: string;
};

type Rate = {
  id: string;
  supplierId: string | null;
  supplierName: string | null;
  netAdult: string;
  netChild: string;
  netInfant: string;
  markupPct: string;
  sellAdult: string;
  sellChild: string;
  sellInfant: string;
  minPax: number | null;
  maxPax: number | null;
  childAgeMin: number | null;
  childAgeMax: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
};

type Props = {
  productId: string;
  rates: Rate[];
  suppliers: Supplier[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(amount: string) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

export function RatesTable({ productId, rates, suppliers }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditingRate(null);
    setModalOpen(true);
  }

  function handleEdit(rate: Rate) {
    setEditingRate(rate);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditingRate(null);
  }

  function handleToggleActive(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleRateActive(id, !currentlyActive, productId);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this rate? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteRate(id, productId);
    });
  }

  // Map rates for the modal (convert string prices to numbers for form)
  const ratesForModal = rates.map((r) => ({
    id: r.id,
    productId,
    supplierId: r.supplierId,
    netAdult: parseFloat(r.netAdult),
    netChild: parseFloat(r.netChild),
    netInfant: parseFloat(r.netInfant),
    markupPct: parseFloat(r.markupPct),
    minPax: r.minPax,
    maxPax: r.maxPax,
    childAgeMin: r.childAgeMin,
    childAgeMax: r.childAgeMax,
    validFrom: r.validFrom,
    validTo: r.validTo,
    isActive: r.isActive,
  }));

  const editingRateForModal = editingRate
    ? ratesForModal.find((r) => r.id === editingRate.id)
    : null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rates & Pricing</h2>
          <p className="text-sm text-slate-500">
            Net costs auto-calculate sell prices using the markup %
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rate
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {rates.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No rates yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Add your first rate to make this product sellable
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add first rate
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Net (A/C/I)
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Markup
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Sell (A/C/I)
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Pax
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
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700">
                      <div className="text-xs">
                        <div>{formatDate(rate.validFrom)}</div>
                        <div className="text-slate-400">
                          to {formatDate(rate.validTo)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {rate.supplierName || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      <div className="text-xs">{formatMoney(rate.netAdult)}</div>
                      <div className="text-xs text-slate-500">
                        {formatMoney(rate.netChild)} / {formatMoney(rate.netInfant)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">
                      {parseFloat(rate.markupPct).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <div className="text-sm font-semibold text-emerald-700">
                        {formatMoney(rate.sellAdult)}
                      </div>
                      <div className="text-xs text-emerald-600">
                        {formatMoney(rate.sellChild)} / {formatMoney(rate.sellInfant)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      <div className="text-xs">
                        {rate.minPax ?? 1}
                        {rate.maxPax ? `–${rate.maxPax}` : "+"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rate.isActive ? (
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
                          onClick={() => handleEdit(rate)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(rate.id, rate.isActive)}
                          disabled={isPending}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                          title={rate.isActive ? "Deactivate" : "Activate"}
                        >
                          {rate.isActive ? (
                            <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Power className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
                          disabled={isPending}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
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

      {/* Modal */}
      <RateFormModal
        open={modalOpen}
        onClose={handleClose}
        productId={productId}
        suppliers={suppliers}
        existingRate={editingRateForModal}
      />
    </>
  );
}
