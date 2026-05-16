import { requireAuth } from "@/lib/auth-utils";
import { getCountriesWithProductCounts, getSearchStats } from "./actions";
import { CountryGrid } from "./country-grid";

export default async function SearchPage() {
  await requireAuth();

  const [countries, stats] = await Promise.all([
    getCountriesWithProductCounts(),
    getSearchStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Search Products</h1>
        <p className="text-slate-500 mt-1">
          Browse tours, excursions, activities, and transfers across{" "}
          <span className="font-medium text-slate-700">
            {stats.totalCountriesWithProducts}
          </span>{" "}
          {stats.totalCountriesWithProducts === 1 ? "country" : "countries"} ·{" "}
          <span className="font-medium text-slate-700">{stats.totalActiveProducts}</span> active products
        </p>
      </div>

      <CountryGrid countries={countries} />
    </div>
  );
}
