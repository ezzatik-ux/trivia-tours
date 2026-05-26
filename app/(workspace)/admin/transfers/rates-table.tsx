"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Power, PowerOff, Trash2, DollarSign } from "lucide-react";
import { deleteRate, updateRate, type VehicleType } from "./actions";
import { TransferRateModal } from "./rate-modal";

type Rate = {
  id: string;
  routeId: string;
  vehicleType: VehicleType;
  maxPax: number;
  maxLuggage: number | null;
  netPrice: string;
  markupPct: string | null;
  sellPrice: string;
  isActive: boolean;
};

type Props = {
  routeId: string;
  rates: Rate[];
};

function formatMoney(amount: string | null) {
  if (!amount) return "$0.00";
  return `$${parseFloat(amount).toFixed(2)}`;
}

export function TransferRatesTable({ routeId, rates }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rate | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(rate: Rate) {
    setEditing(rate);
    setModalOpen(true);
  }

  function handleToggle(rate: Rate) {
    startTransition(async () => {
      await updateRate(rate.id, {
        routeId,
        vehicleType: rate.vehicleType,
        maxPax: rate.maxPax,
        maxLuggage: rate.maxLuggage,
        netPrice: parseFloat(rate.netPrice),
        markupPct: parseFloat(rate.markupPct ?? "0"),
        sellPrice: parseFloat(rate.sellPrice),
        isActive: !rate.isActive,
      });
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this rate?")) return;
    startTransition(async () => {
      const result = await deleteRate(id, routeId);
      if (!result.success) alert(result.error);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rate Card</h2>
          <p className="text-sm text-slate-500">One price per vehicle type for this route</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
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
              Add vehicle rates so sales can quote this route
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
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
                    Vehicle
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Net
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Markup
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Sell
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
                  <tr key={rate.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{rate.vehicleType}</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {rate.maxPax} pax
                      {rate.maxLuggage != null && (
                        <span className="text-slate-500"> · {rate.maxLuggage} bags</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatMoney(rate.netPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {parseFloat(rate.markupPct ?? "0").toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-800">
                      {formatMoney(rate.sellPrice)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rate.isActive ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleToggle(rate)}
                          disabled={isPending}
                          className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-50"
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
                          className="p-1.5 hover:bg-red-50 rounded-lg disabled:opacity-50"
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

      <TransferRateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        routeId={routeId}
        existing={editing}
      />
    </>
  );
}
