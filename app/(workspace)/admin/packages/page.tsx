import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth-utils";
import { getPackages } from "./actions";
import { PackagesTable } from "./packages-table";

export default async function PackagesAdminPage() {
  await requireRole(["OPS", "PRODUCT", "ADMIN"]);
  const rows = await getPackages();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Packages</h1>
          <p className="text-slate-500 mt-1">
            Manage multi-day package content
          </p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New package
        </Link>
      </div>

      <PackagesTable rows={rows} />
    </div>
  );
}
