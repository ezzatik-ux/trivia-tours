import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { searchProducts, getCountryById } from "../actions";
import { ProductBrowse } from "../product-browse";

export default async function CountryProductsPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  await requireAuth();

  const { countryId } = await params;

  const [country, products] = await Promise.all([
    getCountryById(countryId),
    searchProducts({ countryId, sortBy: "price-asc" }),
  ]);

  if (!country) notFound();

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
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <span className="text-4xl">{country.flagEmoji}</span>
          {country.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Browse all available products in {country.name}
        </p>
      </div>

      <ProductBrowse initialProducts={products} countryId={countryId} />
    </div>
  );
}
