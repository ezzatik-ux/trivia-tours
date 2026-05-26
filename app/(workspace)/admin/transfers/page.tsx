import { requireRole } from "@/lib/auth-utils";
import {
  getTransferLocations,
  getTransferRoutes,
  getCountriesForTransfers,
  getSuppliersForTransfers,
} from "./actions";
import { TransfersAdmin } from "./transfers-admin";

export default async function TransfersAdminPage() {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);

  const [locations, routes, countries, suppliers] = await Promise.all([
    getTransferLocations(),
    getTransferRoutes(),
    getCountriesForTransfers(),
    getSuppliersForTransfers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Transfers</h1>
        <p className="text-slate-500 mt-1">
          Manage transfer locations, routes, and per-vehicle rate cards
        </p>
      </div>
      <TransfersAdmin
        locations={locations}
        routes={routes}
        countries={countries}
        suppliers={suppliers}
      />
    </div>
  );
}
