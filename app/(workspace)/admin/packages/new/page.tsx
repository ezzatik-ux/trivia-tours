import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getCountriesForPackages } from "../actions";
import { PackageForm } from "../package-form";

export default async function NewPackagePage() {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);
  const countries = await getCountriesForPackages();

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
        <h1 className="text-3xl font-bold text-slate-900">Add New Package</h1>
        <p className="text-slate-500 mt-1">
          Create a multi-day package (content only — rates & itinerary come later)
        </p>
      </div>

      <PackageForm editing={null} countries={countries} />
    </div>
  );
}
