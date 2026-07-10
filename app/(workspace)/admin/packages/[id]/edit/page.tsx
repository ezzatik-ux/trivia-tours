import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import {
  getCountriesForPackages,
  getPackageById,
  getPackageDays,
} from "../../actions";
import { PackageForm } from "../../package-form";
import { PackageDaysEditor } from "../../package-days-editor";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);

  const { id } = await params;
  const [pkg, countries] = await Promise.all([
    getPackageById(id),
    getCountriesForPackages(),
  ]);

  if (!pkg) notFound();

  const days = await getPackageDays(pkg.id);

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
    </div>
  );
}
