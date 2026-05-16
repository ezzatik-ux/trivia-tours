import { requireRole } from "@/lib/auth-utils";
import { getProducts, getCountriesForFilter } from "./actions";
import { ProductsTable } from "./products-table";

export default async function ProductsPage() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const [products, countries] = await Promise.all([
    getProducts(),
    getCountriesForFilter(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Products</h1>
        <p className="text-slate-500 mt-1">
          Manage tours, excursions, activities, and transfers
        </p>
      </div>

      <ProductsTable products={products} countries={countries} />
    </div>
  );
}
