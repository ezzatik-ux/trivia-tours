import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-utils";
import { getRouteById, getRouteRates } from "../../actions";
import { TransferRatesTable } from "../../rates-table";

export default async function TransferRouteRatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);

  const { id } = await params;

  const [route, rates] = await Promise.all([getRouteById(id), getRouteRates(id)]);

  if (!route) notFound();

  return (
    <div className="space-y-6 max-w-7xl">
      <Link
        href="/admin/transfers"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Routes
      </Link>

      <div>
        <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <span>{route.from_name}</span>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <span>{route.to_name}</span>
        </div>
        <p className="text-slate-500 mt-1">
          {route.country_name}
          {route.supplier_name && ` · ${route.supplier_name}`}
          {route.estimated_duration_min != null && ` · ~${route.estimated_duration_min} min`}
        </p>
      </div>

      <TransferRatesTable routeId={id} rates={rates} />
    </div>
  );
}
