import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getCountriesForFilter } from "../actions";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const countries = await getCountriesForFilter();

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add New Product</h1>
        <p className="text-slate-500 mt-1">Create a tour, excursion, activity, or transfer</p>
      </div>

      <ProductForm mode="create" countries={countries} />
    </div>
  );
}
