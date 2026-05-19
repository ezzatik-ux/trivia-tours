"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Power, PowerOff, Trash2, Bed, Users, Ruler, Eye } from "lucide-react";
import { RoomTypeModal } from "./room-type-modal";
import { toggleRoomTypeActive, deleteRoomType } from "./room-types-actions";

type RoomType = {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  maxOccupancy: number;
  bedConfig: string | null;
  sizeM2: string | null;
  view: string | null;
  amenities: string[] | null;
  totalRooms: number | null;
  isActive: boolean;
};

type Props = {
  hotelId: string;
  roomTypes: RoomType[];
};

export function RoomTypesTable({ hotelId, roomTypes }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleEdit(rt: RoomType) {
    setEditing(rt);
    setModalOpen(true);
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleRoomTypeActive(id, !currentlyActive, hotelId);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All rates for this room type will also be deleted.`)) return;
    startTransition(async () => {
      await deleteRoomType(id, hotelId);
    });
  }

  // Map for modal
  const editingForModal = editing
    ? {
        ...editing,
        sizeM2: editing.sizeM2 ? parseFloat(editing.sizeM2) : null,
        amenities: editing.amenities ?? [],
      }
    : null;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Room Types</h2>
          <p className="text-sm text-slate-500">Categories of rooms available at this hotel</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Room Type
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {roomTypes.length === 0 ? (
          <div className="p-12 text-center">
            <Bed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No room types yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Add room categories from the hotel&apos;s contract
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add first room type
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Room Type
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Specs
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Inventory
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
              {roomTypes.map((rt) => (
                <tr key={rt.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-900">{rt.name}</div>
                    {rt.description && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-md">
                        {rt.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {rt.maxOccupancy} max
                      </div>
                      {rt.sizeM2 && (
                        <div className="flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-slate-400" />
                          {parseFloat(rt.sizeM2).toFixed(0)} m²
                        </div>
                      )}
                      {rt.view && (
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {rt.view}
                        </div>
                      )}
                      {rt.bedConfig && (
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-3.5 h-3.5 text-slate-400" />
                          {rt.bedConfig}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {rt.totalRooms ? (
                      <span className="font-mono">{rt.totalRooms} rooms</span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No limit</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {rt.isActive ? (
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
                        onClick={() => handleEdit(rt)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleToggle(rt.id, rt.isActive)}
                        disabled={isPending}
                        className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                        title={rt.isActive ? "Deactivate" : "Activate"}
                      >
                        {rt.isActive ? (
                          <PowerOff className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Power className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(rt.id, rt.name)}
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
        )}
      </div>

      <RoomTypeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        hotelId={hotelId}
        existing={editingForModal}
      />
    </>
  );
}
