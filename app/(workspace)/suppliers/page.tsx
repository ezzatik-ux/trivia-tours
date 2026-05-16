import { requireRole } from "@/lib/auth-utils";
import { getSuppliers, getCountries } from "./actions";
import { SuppliersTable } from "./suppliers-table";

export default async function SuppliersPage() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const [suppliers, countries] = await Promise.all([
    getSuppliers(),
    getCountries(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
        <p className="text-slate-500 mt-1">Manage your supplier network across all countries</p>
      </div>

      <SuppliersTable suppliers={suppliers} countries={countries} />
    </div>
  );
}
