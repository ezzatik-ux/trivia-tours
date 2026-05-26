import { requireRole } from "@/lib/auth-utils";
import { getTransferLocations, getCountriesForTransfers } from "../actions";
import { TransfersNav } from "../transfers-nav";
import { LocationsTable } from "../locations-table";

export default async function TransferLocationsPage() {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);

  const [locations, countries] = await Promise.all([
    getTransferLocations(),
    getCountriesForTransfers(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Transfers</h1>
        <p className="text-slate-500 mt-1">
          Manage pickup/dropoff locations used in transfer routes
        </p>
      </div>

      <TransfersNav />

      <LocationsTable locations={locations} countries={countries} />
    </div>
  );
}
