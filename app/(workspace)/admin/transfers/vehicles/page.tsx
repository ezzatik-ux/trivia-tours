import { requireRole } from "@/lib/auth-utils";
import { getVehicleClasses } from "./actions";
import { VehicleCatalog } from "./vehicle-catalog";
import { TransfersNav } from "../transfers-nav";

export default async function VehicleCatalogPage() {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);
  const classes = await getVehicleClasses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Transfers</h1>
        <p className="text-slate-500 mt-1">Manage your vehicle class catalog</p>
      </div>
      <TransfersNav />
      <VehicleCatalog classes={classes} />
    </div>
  );
}
