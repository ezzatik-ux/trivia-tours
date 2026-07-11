import { requireAuth } from "@/lib/auth-utils";
import { getPackagesForBrowse, getCountriesForBrowse } from "./actions";
import { PackagesBrowse } from "./packages-browse";

export default async function PackagesPage() {
  await requireAuth();

  const [packages, countries] = await Promise.all([
    getPackagesForBrowse(),
    getCountriesForBrowse(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Packages</h1>
        <p className="text-slate-500 mt-1">
          Browse multi-day packages available to quote and sell
        </p>
      </div>

      <PackagesBrowse initialPackages={packages} countries={countries} />
    </div>
  );
}
