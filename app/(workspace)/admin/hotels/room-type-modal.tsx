"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Bed } from "lucide-react";
import { ListEditor } from "@/components/ui/list-editor";
import { createRoomType, updateRoomType, type RoomTypeInput } from "./room-types-actions";

type RoomType = RoomTypeInput & { id: string };

type Props = {
  open: boolean;
  onClose: () => void;
  hotelId: string;
  existing?: RoomType | null;
};

const VIEWS = ["Garden", "Sea/Ocean", "Pool", "Mountain", "City", "Sawah/Rice Field", "Courtyard"];

export function RoomTypeModal({ open, onClose, hotelId, existing }: Props) {
  const isEditing = !!existing;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [maxOccupancy, setMaxOccupancy] = useState(existing?.maxOccupancy ?? 2);
  const [bedConfig, setBedConfig] = useState(existing?.bedConfig ?? "");
  const [sizeM2, setSizeM2] = useState(existing?.sizeM2?.toString() ?? "");
  const [view, setView] = useState(existing?.view ?? "");
  const [amenities, setAmenities] = useState<string[]>(existing?.amenities ?? []);
  const [totalRooms, setTotalRooms] = useState(existing?.totalRooms?.toString() ?? "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: RoomTypeInput = {
      hotelId,
      name,
      description: description || null,
      maxOccupancy,
      bedConfig: bedConfig || null,
      sizeM2: sizeM2 ? parseFloat(sizeM2) : null,
      view: view || null,
      amenities,
      totalRooms: totalRooms ? parseInt(totalRooms) : null,
      isActive,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateRoomType(existing!.id, input)
        : await createRoomType(input);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-trivia-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditing ? "Edit Room Type" : "Add Room Type"}
            </h2>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Room Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Deluxe Suite (Garden View)"
              required
              disabled={isPending}
              className="form-input"
            />
            <p className="text-xs text-slate-500 mt-1">Copy directly from contract PDF for consistency</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief room description"
              rows={2}
              disabled={isPending}
              className="form-input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Occupancy</label>
              <input
                type="number"
                value={maxOccupancy}
                onChange={(e) => setMaxOccupancy(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                disabled={isPending}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Room Size (m²)</label>
              <input
                type="number"
                value={sizeM2}
                onChange={(e) => setSizeM2(e.target.value)}
                placeholder="e.g., 45"
                step="0.5"
                disabled={isPending}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bed Configuration</label>
              <input
                type="text"
                value={bedConfig}
                onChange={(e) => setBedConfig(e.target.value)}
                placeholder="e.g., 1 King or 2 Twins"
                disabled={isPending}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">View</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                disabled={isPending}
                className="form-input bg-white"
              >
                <option value="">-- Select view --</option>
                {VIEWS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Total Rooms <span className="text-slate-400 font-normal text-xs">(optional, for inventory)</span>
              </label>
              <input
                type="number"
                value={totalRooms}
                onChange={(e) => setTotalRooms(e.target.value)}
                placeholder="e.g., 12 (from contract)"
                min="1"
                disabled={isPending}
                className="form-input"
              />
            </div>
          </div>

          <ListEditor
            label="Room Amenities"
            placeholder="e.g., Private Pool"
            values={amenities}
            onChange={setAmenities}
            disabled={isPending}
          />

          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Active (available to book)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="px-5 py-2 text-sm font-medium text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Room Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
