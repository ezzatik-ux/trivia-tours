import { requireRole } from "@/lib/auth-utils";
import { getHotels, getCountriesForHotels } from "./actions";
import { HotelsTable } from "./hotels-table";

export default async function HotelsPage() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const [hotels, countries] = await Promise.all([
    getHotels(),
    getCountriesForHotels(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hotels</h1>
        <p className="text-slate-500 mt-1">
          Manage hotel inventory, room types, seasons, and rates
        </p>
      </div>

      <HotelsTable hotels={hotels} countries={countries} />
    </div>
  );
}
