"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, Hotel } from "lucide-react";
import { CountryFlag, countryFlagEmoji } from "@/components/ui/country-flag";

type Country = {
  id: string;
  code: string | null;
  name: string;
  hotelCount: number;
};

type Props = {
  countries: Country[];
};

export function HotelSearchHero({ countries }: Props) {
  const router = useRouter();

  // Default dates: 2 weeks from now, 3 nights
  const today = new Date();
  const defaultCheckIn = new Date(today);
  defaultCheckIn.setDate(today.getDate() + 14);
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckIn.getDate() + 3);

  const [destination, setDestination] = useState("ALL");
  const [checkIn, setCheckIn] = useState(defaultCheckIn.toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(defaultCheckOut.toISOString().split("T")[0]);
  const [pax, setPax] = useState(2);

  function handleSearch() {
    const params = new URLSearchParams();
    if (destination !== "ALL") params.set("destination", destination);
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
    params.set("pax", pax.toString());
    router.push(`/hotels/results?${params.toString()}`);
  }

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="space-y-8">
      {/* Hero search card */}
      <div className="bg-gradient-to-br from-trivia-900 via-trivia-900 to-slate-900 rounded-3xl shadow-elevated p-6 md:p-10 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-trivia-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Where to next?</h2>
            <p className="text-white/70 mt-1">
              Search confirmed hotel inventory across global destinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white rounded-2xl p-2 shadow-medium">
            <div className="md:col-span-4 relative">
              <div className="px-4 py-2 group cursor-pointer">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  <MapPin className="w-3 h-3" />
                  Destination
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
            </div>

            <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

            <div className="md:col-span-2 px-4 py-2">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                <Calendar className="w-3 h-3" />
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
              />
            </div>


            <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

            <div className="md:col-span-2 px-4 py-2">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                <Calendar className="w-3 h-3" />
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
              />
            </div>

            <div className="hidden md:block w-px bg-slate-200 self-stretch my-2" />

            <div className="md:col-span-2 px-4 py-2">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                <Users className="w-3 h-3" />
                Guests
              </label>
              <input
                type="number"
                value={pax}
                onChange={(e) => setPax(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
                className="w-full mt-0.5 bg-transparent text-slate-900 font-semibold text-sm focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex">
              <button
                onClick={handleSearch}
                className="w-full bg-trivia-500 hover:bg-trivia-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-brand"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>


          {nights > 0 && (
            <p className="text-white/70 text-sm">
              📅 {nights} {nights === 1 ? "night" : "nights"} · {pax} {pax === 1 ? "guest" : "guests"}
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
            <p className="text-sm text-slate-400 mt-1">
              Your Product team can add hotels via the admin panel
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {countries.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("destination", c.id);
                  params.set("checkIn", checkIn);
                  params.set("checkOut", checkOut);
                  params.set("pax", pax.toString());
                  router.push(`/hotels/results?${params.toString()}`);
                }}
                className="group bg-white border border-slate-200 hover:border-trivia-300 rounded-2xl p-4 text-left transition-all hover:shadow-medium"
              >
                <div className="mb-2">
                  <CountryFlag code={c.code} name={c.name} className="h-8 w-12 rounded-md" />
                </div>
                <div className="font-semibold text-slate-900 group-hover:text-trivia-700 transition-colors">
                  {c.name}
                </div>
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
