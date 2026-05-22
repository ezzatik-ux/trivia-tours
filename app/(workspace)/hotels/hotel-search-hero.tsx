"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, Hotel, ChevronDown, Plus, Minus } from "lucide-react";
import { CountryFlag, countryFlagEmoji } from "@/components/ui/country-flag";

type Country = { id: string; code: string | null; name: string; hotelCount: number };
type Props = { countries: Country[] };

export function HotelSearchHero({ countries }: Props) {
  const router = useRouter();

  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 14);
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckIn.getDate() + 3);

  const [destination, setDestination] = useState("ALL");
  const [checkIn, setCheckIn] = useState(defaultCheckIn.toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(defaultCheckOut.toISOString().split("T")[0]);
  const [query, setQuery] = useState("");
  const [stars, setStars] = useState<number[]>([]);

  // Occupancy
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [rooms, setRooms] = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);
  const guestRef = useRef<HTMLDivElement>(null);

  // Keep childAges array length in sync with children count
  useEffect(() => {
    setChildAges((prev) => {
      const next = [...prev];
      if (children > prev.length) {
        while (next.length < children) next.push(8); // default age 8
      } else {
        next.length = children;
      }
      return next;
    });
  }, [children]);

  // Close popover on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setGuestOpen(false);
      }
    }
    if (guestOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [guestOpen]);

  function buildParams() {
    const p = new URLSearchParams();
    if (query.trim()) p.set("query", query.trim());
    if (destination !== "ALL") p.set("destination", destination);
    p.set("checkIn", checkIn);
    p.set("checkOut", checkOut);
    p.set("adults", adults.toString());
    p.set("children", children.toString());
    p.set("rooms", rooms.toString());
    if (children > 0) p.set("childAges", childAges.join(","));
    p.set("pax", (adults + children).toString()); // backward-compat
    if (stars.length > 0) p.set("starRatings", [...stars].sort((a, b) => b - a).join(","));
    return p;
  }

  function handleSearch() {
    router.push(`/hotels/results?${buildParams().toString()}`);
  }

  function toggleStar(s: number) {
    setStars((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  const nights = Math.max(
    1,
    Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  );

  const guestSummary = `${adults} adult${adults !== 1 ? "s" : ""}${
    children > 0 ? ` · ${children} child${children !== 1 ? "ren" : ""}` : ""
  } · ${rooms} room${rooms !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-trivia-900 via-trivia-900 to-slate-900 rounded-3xl shadow-elevated p-6 md:p-10 text-white relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-trivia-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Where to next?</h2>
            <p className="text-white/70 mt-1">Search confirmed hotel inventory across global destinations</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="bg-white rounded-2xl p-3 shadow-medium space-y-3"
          >
            {/* Row 1: full-width text search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hotel name or city — e.g. Oberoi, Hurghada…"
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
              />
            </div>

            {/* Row 2: destination · dates · guests · search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              {/* Destination */}
              <div className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <MapPin className="w-3 h-3" /> Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All destinations</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {countryFlagEmoji(c.code)} {c.name} ({c.hotelCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Check-in */}
              <div className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <Calendar className="w-3 h-3" /> Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
                />
              </div>

              {/* Check-out */}
              <div className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <Calendar className="w-3 h-3" /> Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
                />
              </div>

              {/* Guests & Rooms popover trigger */}
              <div className="md:col-span-3 relative" ref={guestRef}>
                <button
                  type="button"
                  onClick={() => setGuestOpen((o) => !o)}
                  className="w-full h-full px-3 py-2 rounded-xl border border-slate-200 text-left flex items-center justify-between"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      <Users className="w-3 h-3" /> Guests & Rooms
                    </span>
                    <span className="block mt-0.5 text-slate-900 font-semibold text-sm truncate">
                      {guestSummary}
                    </span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${guestOpen ? "rotate-180" : ""}`} />
                </button>

                {guestOpen && (
                  <div className="absolute z-50 mt-2 right-0 w-full md:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    <Stepper label="Adults" sub="Age 18+" value={adults} min={1} max={20} onChange={setAdults} />
                    <Stepper label="Children" sub="Age 0–17" value={children} min={0} max={10} onChange={setChildren} />

                    {children > 0 && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-600">Age of each child at check-out</p>
                        <div className="grid grid-cols-2 gap-2">
                          {childAges.map((age, i) => (
                            <div key={i}>
                              <label className="text-[10px] text-slate-500">Child {i + 1}</label>
                              <select
                                value={age}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value);
                                  setChildAges((prev) => prev.map((a, idx) => (idx === i ? v : a)));
                                }}
                                className="w-full mt-0.5 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-trivia-500/30"
                              >
                                {Array.from({ length: 18 }, (_, n) => (
                                  <option key={n} value={n}>
                                    {n === 0 ? "<1 year" : `${n} year${n !== 1 ? "s" : ""}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-1 border-t border-slate-100">
                      <Stepper label="Rooms" value={rooms} min={1} max={10} onChange={setRooms} />
                    </div>

                    <button
                      type="button"
                      onClick={() => setGuestOpen(false)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="md:col-span-2 flex">
                <button
                  type="submit"
                  className="w-full bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-brand py-3"
                >
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>

            {/* Row 3: star chips */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-500">Stars:</span>
              {[5, 4, 3].map((s) => {
                const active = stars.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStar(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-1 ${
                      active ? "border-trivia-500 bg-trivia-50 text-trivia-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s} <span className="text-amber-400">★</span>
                  </button>
                );
              })}
              {stars.length > 0 && (
                <button type="button" onClick={() => setStars([])} className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600">
                  Clear
                </button>
              )}
            </div>
          </form>

          {nights > 0 && (
            <p className="text-white/70 text-sm">
              📅 {nights} {nights === 1 ? "night" : "nights"} · {guestSummary}
            </p>
          )}
        </div>
      </div>

      {/* Popular destinations */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Popular Destinations</h3>
        {countries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Hotel className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No hotels in catalog yet</p>
            <p className="text-sm text-slate-400 mt-1">Your Product team can add hotels via the admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {countries.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  const p = buildParams();
                  p.set("destination", c.id);
                  router.push(`/hotels/results?${p.toString()}`);
                }}
                className="group bg-white border border-slate-200 hover:border-trivia-300 rounded-2xl p-4 text-left transition-all hover:shadow-medium"
              >
                <div className="mb-2">
                  <CountryFlag code={c.code} name={c.name} className="h-8 w-12 rounded-md" />
                </div>
                <div className="font-semibold text-slate-900 group-hover:text-trivia-700 transition-colors">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {c.hotelCount} {c.hotelCount === 1 ? "hotel" : "hotels"} available
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stepper ───
function Stepper({
  label, sub, value, min = 0, max = 99, onChange,
}: {
  label: string; sub?: string; value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-trivia-500 hover:text-trivia-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:border-trivia-500 hover:text-trivia-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
