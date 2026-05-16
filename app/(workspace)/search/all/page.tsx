import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { searchProducts } from "../actions";
import { ProductBrowse } from "../product-browse";

export default async function BrowseAllPage() {
  await requireAuth();

  const products = await searchProducts({ sortBy: "price-asc" });

  return (
    <div className="space-y-6">
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all countries
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">All Products</h1>
        <p className="text-slate-500 mt-1">
          Browse the full catalog across all countries
        </p>
      </div>

      <ProductBrowse initialProducts={products} countryId={null} />
    </div>
  );
}
