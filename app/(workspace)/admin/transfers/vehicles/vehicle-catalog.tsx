"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users, Briefcase, Car, Globe, Loader2 } from "lucide-react";
import { deleteVehicleClass } from "./actions";
import { VehicleClassModal } from "./vehicle-class-modal";

type VehicleClass = {
  id: string;
  name: string;
  tier: number;
  baseVehicleType: string | null;
  exampleModels: string | null;
  description: string | null;
  imageUrl: string | null;
  maxPax: number;
  maxLuggage: number | null;
  amenities: string[] | null;
  driverLanguages: string[] | null;
  isActive: boolean;
};

export function VehicleCatalog({ classes }: { classes: VehicleClass[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleClass | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(vc: VehicleClass) {
    setEditing(vc);
    setModalOpen(true);
  }
  async function handleDelete(id: string) {
    if (!confirm("Delete this vehicle class?")) return;
    setDeletingId(id);
    const res = await deleteVehicleClass(id);
    setDeletingId(null);
    if (res.success) router.refresh();
    else alert(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Vehicle classes <span className="text-slate-400 font-normal">({classes.length})</span>
        </h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add vehicle class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No vehicle classes yet</p>
          <p className="text-sm text-slate-400 mt-1">Add Standard, Business, Minivan, etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((vc) => (
            <div key={vc.id} className={`bg-white rounded-2xl border overflow-hidden ${vc.isActive ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
              <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                {vc.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vc.imageUrl} alt={vc.name} className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-12 h-12 text-slate-300" />
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-700">
                  Tier {vc.tier}
                </span>
                {!vc.isActive && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">Inactive</span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{vc.name}</h3>
                    {vc.exampleModels && <p className="text-xs text-slate-500">{vc.exampleModels}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> {vc.maxPax}</span>
                  {vc.maxLuggage != null && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-400" /> {vc.maxLuggage}</span>}
                  {vc.driverLanguages && vc.driverLanguages.length > 0 && (
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-400" /> {vc.driverLanguages.length} lang</span>
                  )}
                </div>
                {vc.amenities && vc.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {vc.amenities.slice(0, 3).map((a) => (
                      <span key={a} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">{a}</span>
                    ))}
                    {vc.amenities.length > 3 && <span className="px-1.5 py-0.5 text-[10px] text-slate-400">+{vc.amenities.length - 3}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => openEdit(vc)} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(vc.id)} disabled={deletingId === vc.id} className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">
                    {deletingId === vc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <VehicleClassModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </div>
  );
}
