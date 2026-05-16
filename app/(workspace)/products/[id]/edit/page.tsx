import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getCountriesForFilter, getProductById } from "../../actions";
import { ProductForm } from "../../product-form";
import { ProductNav } from "../../product-nav";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const { id } = await params;
  const [product, countries] = await Promise.all([
    getProductById(id),
    getCountriesForFilter(),
  ]);

  if (!product) {
    notFound();
  }

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
        <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        <p className="text-slate-500 mt-1">Edit product details</p>
      </div>

      <ProductNav productId={id} />

      <ProductForm
        mode="edit"
        productId={id}
        countries={countries}
        initialData={{
          type: product.type,
          countryId: product.countryId,
          name: product.name,
          slug: product.slug,
          shortDesc: product.shortDesc,
          longDesc: product.longDesc,
          durationHours: product.durationHours ? parseFloat(product.durationHours) : null,
          language: product.language,
          meetingPoint: product.meetingPoint,
          inclusions: product.inclusions ?? [],
          exclusions: product.exclusions ?? [],
          cancellationPolicy: product.cancellationPolicy,
          importantInfo: product.importantInfo,
          status: product.status,
          images: product.images.map((img) => ({
            url: img.url,
            isCover: img.isCover,
            sortOrder: img.sortOrder ?? 0,
          })),
        }}
      />
    </div>
  );
}
