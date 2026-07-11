import { requireRole } from "@/lib/auth-utils";
import { getCities, getCountriesForCities } from "./actions";
import { CitiesCatalog } from "./cities-catalog";

export default async function CitiesPage() {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);

  const [cities, countries] = await Promise.all([
    getCities(),
    getCountriesForCities(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Cities</h1>
        <p className="text-slate-500 mt-1">
          Manage cities and their 3-letter codes
        </p>
      </div>
      <CitiesCatalog cities={cities} countries={countries} />
    </div>
  );
}
