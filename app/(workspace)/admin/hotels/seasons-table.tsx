"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Edit2,
  Power,
  PowerOff,
  Trash2,
  Calendar,
  Sun,
  Snowflake,
  Flame,
  Leaf,
} from "lucide-react";
import { SeasonModal } from "./season-modal";
import { toggleSeasonActive, deleteSeason } from "./seasons-actions";

type Season = {
  id: string;
  hotelId: string;
  name: string;
  validFrom: string;
  validTo: string;
  surchargePerNight: string | null;
  priority: number | null;
  isActive: boolean;
};

type Props = {
  hotelId: string;
  seasons: Season[];
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  0: { label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Leaf },
  1: { label: "Mid", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Sun },
  2: { label: "High", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Flame },
  3: { label: "Peak", color: "bg-red-100 text-red-700 border-red-200", icon: Snowflake },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SeasonsTable({ hotelId, seasons }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(s: Season) {
    setEditing(s);
    setModalOpen(true);
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleSeasonActive(id, !currentlyActive, hotelId);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete season "${name}"? Rates linked to it will lose their season reference.`)) return;
    startTransition(async () => {
      await deleteSeason(id, hotelId);
    });
  }

  const editingForModal = editing
    ? {
        ...editing,
        surchargePerNight: editing.surchargePerNight ? parseFloat(editing.surchargePerNight) : 0,
        priority: editing.priority ?? 1,
      }
    : null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Rate Seasons</h2>
          <p className="text-sm text-slate-500">
            Date ranges with different pricing tiers and surcharges
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Season
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {seasons.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No seasons defined yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Define date ranges from the contract to set seasonal pricing
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add first season
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Season
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Date Range
                </th>
                <th className="text-right px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Surcharge
                </th>
                <th className="text-center px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-center px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seasons.map((s) => {
                const config = PRIORITY_CONFIG[s.priority ?? 1] ?? PRIORITY_CONFIG[1];
                const Icon = config.icon;
                const surcharge = s.surchargePerNight ? parseFloat(s.surchargePerNight) : 0;
                const nights = Math.ceil(
                  (new Date(s.validTo).getTime() - new Date(s.validFrom).getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{nights} nights</div>
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      <div className="text-sm">
                        {formatDate(s.validFrom)} → {formatDate(s.validTo)}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {surcharge > 0 ? (
                        <span className="font-mono text-slate-900 font-medium">
                          +${surcharge.toFixed(2)}<span className="text-xs text-slate-500">/night</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No surcharge</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {s.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleToggle(s.id, s.isActive)}
                          disabled={isPending}
                          className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                          title={s.isActive ? "Deactivate" : "Activate"}
                        >
                          {s.isActive ? (
                            <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Power className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
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
        )}
      </div>

      <SeasonModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        hotelId={hotelId}
        existing={editingForModal}
      />
    </>
  );
}
