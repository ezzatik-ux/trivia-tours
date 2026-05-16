import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getProductById } from "../../actions";
import { getRatesByProduct, getActiveSuppliers } from "../../rates-actions";
import { ProductNav } from "../../product-nav";
import { RatesTable } from "../../rates-table";

export default async function ProductRatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const { id } = await params;
  const [product, rates, suppliers] = await Promise.all([
    getProductById(id),
    getRatesByProduct(id),
    getActiveSuppliers(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6 max-w-6xl">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        <p className="text-slate-500 mt-1">Manage pricing</p>
      </div>

      <ProductNav productId={id} />

      <RatesTable productId={id} rates={rates} suppliers={suppliers} />
    </div>
  );
}
