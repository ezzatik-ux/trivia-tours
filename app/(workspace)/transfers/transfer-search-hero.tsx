"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, Calendar, Users, Car } from "lucide-react";

type Location = {
  id: string;
  name: string;
  type: string;
  city_name: string | null;
  code: string | null;
};

type Props = { locations: Location[] };

export function TransferSearchHero({ locations }: Props) {
  const router = useRouter();

  const today = new Date();
  const defaultDate = new Date(today);
  defaultDate.setDate(today.getDate() + 7);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [date, setDate] = useState(defaultDate.toISOString().split("T")[0]);
  const [pax, setPax] = useState(2);
  const [error, setError] = useState<string | null>(null);

  function handleSearch() {
    setError(null);
    if (!fromId || !toId) {
      setError("Please select both pickup and drop-off locations");
      return;
    }
    if (fromId === toId) {
      setError("Pickup and drop-off must be different");
      return;
    }
    const params = new URLSearchParams();
    params.set("from", fromId);
    params.set("to", toId);
    params.set("date", date);
    params.set("pax", pax.toString());
    router.push(`/transfers/results?${params.toString()}`);
  }

  const labelFor = (l: Location) =>
    `${l.name}${l.code ? ` (${l.code})` : ""}${l.city_name ? ` — ${l.city_name}` : ""}`;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-trivia-900 via-trivia-900 to-slate-900 rounded-3xl shadow-elevated p-6 md:p-10 text-white relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-trivia-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6" />
            <h2 className="text-2xl md:text-3xl font-bold">Book a transfer</h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="bg-white rounded-2xl p-3 shadow-medium space-y-3"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              {/* From */}
              <div className="md:col-span-4 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <MapPin className="w-3 h-3" /> Pickup
                </label>
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none cursor-pointer"
                >
                  <option value="">Select pickup…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{labelFor(l)}</option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div className="md:col-span-4 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <ArrowRight className="w-3 h-3" /> Drop-off
                </label>
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none cursor-pointer"
                >
                  <option value="">Select drop-off…</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{labelFor(l)}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
                />
              </div>

              {/* Pax */}
              <div className="md:col-span-1 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <Users className="w-3 h-3" /> Pax
                </label>
                <input
                  type="number"
                  value={pax}
                  onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="60"
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
                />
              </div>

              {/* Search */}
              <div className="md:col-span-1 flex">
                <button
                  type="submit"
                  className="w-full bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-brand py-3"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          <p className="text-white/70 text-sm">
            Fixed price · Meet &amp; greet included · No hidden fees
          </p>
        </div>
      </div>

      {locations.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No transfer routes available yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Operations can add routes and rates in the admin panel
          </p>
        </div>
      )}
    </div>
  );
}
