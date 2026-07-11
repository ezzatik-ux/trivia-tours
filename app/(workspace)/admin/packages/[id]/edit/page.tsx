import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import {
  getCountriesForPackages,
  getCitiesForPackages,
  getPackageById,
  getPackageDays,
  getPackageImages,
  getPackageRates,
} from "../../actions";
import { PackageForm } from "../../package-form";
import { PackageDaysEditor } from "../../package-days-editor";
import { PackageImagesSection } from "../../package-images-section";
import { PackageRatesSection } from "../../package-rates-section";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);

  const { id } = await params;
  const [pkg, countries, cities] = await Promise.all([
    getPackageById(id),
    getCountriesForPackages(),
    getCitiesForPackages(),
  ]);

  if (!pkg) notFound();

  const [days, images, rates] = await Promise.all([
    getPackageDays(pkg.id),
    getPackageImages(pkg.id),
    getPackageRates(pkg.id),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/packages"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Packages
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">{pkg.name}</h1>
        <p className="text-slate-500 mt-1">Edit package details</p>
      </div>

      <PackageForm
        editing={{
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          countryId: pkg.countryId,
          cityId: pkg.cityId,
          shortDesc: pkg.shortDesc,
          overview: pkg.overview,
          durationDays: pkg.durationDays,
          durationNights: pkg.durationNights,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          highlights: pkg.highlights,
          cancellationPolicy: pkg.cancellationPolicy,
          importantInfo: pkg.importantInfo,
          status: pkg.status,
        }}
        countries={countries}
        cities={cities}
      />

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Itinerary days</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Saved separately from package content above
          </p>
        </div>
        <PackageDaysEditor packageId={pkg.id} initialDays={days} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Images</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Saved separately from content and itinerary
          </p>
        </div>
        <PackageImagesSection
          packageId={pkg.id}
          initialImages={images.map((img) => ({
            url: img.url,
            isCover: img.isCover,
            sortOrder: img.sortOrder ?? 0,
          }))}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Rates</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Cost + markup per person; sell computed on save
          </p>
        </div>
        <PackageRatesSection packageId={pkg.id} initialRates={rates} />
      </div>
    </div>
  );
}
