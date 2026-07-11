"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Edit2, Trash2, Package2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { deletePackage } from "./actions";
import { useRouter } from "next/navigation";

type PackageRow = {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  countryName: string | null;
  durationDays: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  updatedAt: Date;
};

export function PackagesTable({ rows }: { rows: PackageRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deletePackage(id);
      setDeletingId(null);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete package");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Package2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No packages yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Create your first multi-day package to get started.
        </p>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium"
        >
          New package
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Code</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Country</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Duration</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{row.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {row.slug}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {row.code ? (
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {row.code}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.countryName ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.durationDays}{" "}
                  {row.durationDays === 1 ? "day" : "days"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/packages/${row.id}/edit`}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id, row.name)}
                      disabled={isPending && deletingId === row.id}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === row.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
