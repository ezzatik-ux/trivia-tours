"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Car } from "lucide-react";
import { createVehicleClass, updateVehicleClass } from "./actions";
import { TRANSFER_AMENITIES, DRIVER_LANGUAGES } from "@/lib/transfer-options";

type VehicleClass = {
  id: string;
  name: string;
  tier: number;
  exampleModels: string | null;
  description: string | null;
  imageUrl: string | null;
  maxPax: number;
  maxLuggage: number | null;
  amenities: string[] | null;
  driverLanguages: string[] | null;
  isActive: boolean;
} | null;

type Props = { open: boolean; onClose: () => void; editing: VehicleClass };

export function VehicleClassModal({ open, onClose, editing }: Props) {
  const router = useRouter();
  const isEdit = !!editing;
  const [name, setName] = useState("");
  const [tier, setTier] = useState("1");
  const [exampleModels, setExampleModels] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [maxPax, setMaxPax] = useState("3");
  const [maxLuggage, setMaxLuggage] = useState("3");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [driverLanguages, setDriverLanguages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setTier(editing?.tier?.toString() ?? "1");
      setExampleModels(editing?.exampleModels ?? "");
      setDescription(editing?.description ?? "");
      setImageUrl(editing?.imageUrl ?? "");
      setMaxPax(editing?.maxPax?.toString() ?? "3");
      setMaxLuggage(editing?.maxLuggage?.toString() ?? "3");
      setAmenities(editing?.amenities ?? []);
      setDriverLanguages(editing?.driverLanguages ?? []);
      setIsActive(editing?.isActive ?? true);
      setError(null);
    }
  }, [open, editing]);

  if (!open) return null;

  function toggle(list: string[], setList: (v: string[]) => void, val: string) {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required");
    startTransition(async () => {
      const payload = {
        name,
        tier: parseInt(tier) || 1,
        exampleModels: exampleModels || null,
        description: description || null,
        imageUrl: imageUrl || null,
        maxPax: parseInt(maxPax) || 1,
        maxLuggage: maxLuggage === "" ? null : parseInt(maxLuggage),
        amenities,
        driverLanguages,
      };
      const res = isEdit
        ? await updateVehicleClass(editing!.id, { ...payload, isActive })
        : await createVehicleClass(payload);
      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.error || "Failed");
      }
    });
  }

  const fieldCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-trivia-200 focus:border-trivia-400";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50">
      <div className="bg-white md:rounded-2xl rounded-t-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-trivia-600" />
            <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Vehicle Class" : "Add Vehicle Class"}</h2>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard, Business" disabled={isPending} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Tier</label>
              <input type="number" min="1" value={tier} onChange={(e) => setTier(e.target.value)} disabled={isPending} className={fieldCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Example models</label>
            <input type="text" value={exampleModels} onChange={(e) => setExampleModels(e.target.value)} placeholder="e.g. Toyota Corolla and similar" disabled={isPending} className={fieldCls} />
          </div>

          <div>
            <label className={labelCls}>Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Cloudinary image URL" disabled={isPending} className={fieldCls} />
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="preview" className="mt-2 h-24 rounded-lg object-cover border border-slate-200" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Max passengers</label>
              <input type="number" min="1" value={maxPax} onChange={(e) => setMaxPax(e.target.value)} disabled={isPending} className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Max luggage</label>
              <input type="number" min="0" value={maxLuggage} onChange={(e) => setMaxLuggage(e.target.value)} disabled={isPending} className={fieldCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Amenities</label>
            <div className="flex flex-wrap gap-2">
              {TRANSFER_AMENITIES.map((a) => (
                <button key={a} type="button" onClick={() => toggle(amenities, setAmenities, a)} disabled={isPending}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${amenities.includes(a) ? "bg-trivia-50 border-trivia-300 text-trivia-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Driver languages</label>
            <div className="flex flex-wrap gap-2">
              {DRIVER_LANGUAGES.map((l) => (
                <button key={l} type="button" onClick={() => toggle(driverLanguages, setDriverLanguages, l)} disabled={isPending}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${driverLanguages.includes(l) ? "bg-trivia-50 border-trivia-300 text-trivia-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isPending} />
              Active
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isPending} className="px-5 py-2.5 text-sm font-semibold text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save" : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
