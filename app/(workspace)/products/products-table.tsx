"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Edit2, Plus, Search, Package2, Trash2, Image as ImageIcon } from "lucide-react";
import { ProductTypeBadge } from "@/components/ui/product-type-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { cycleProductStatus, deleteProduct } from "./actions";

type Country = {
  id: string;
  name: string;
  flagEmoji: string | null;
};

type Product = {
  id: string;
  type: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";
  name: string;
  slug: string;
  shortDesc: string | null;
  durationHours: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  countryId: string;
  countryName: string | null;
  countryFlag: string | null;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Props = {
  products: Product[];
  countries: Country[];
};

const PRODUCT_TYPES: Array<"TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER"> = [
  "TOUR",
  "EXCURSION",
  "ACTIVITY",
  "TRANSFER",
];

const STATUSES: Array<"DRAFT" | "ACTIVE" | "INACTIVE"> = ["DRAFT", "ACTIVE", "INACTIVE"];

export function ProductsTable({ products, countries }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.countryName?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "ALL" || p.type === typeFilter;
      const matchesCountry = countryFilter === "ALL" || p.countryId === countryFilter;
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesSearch && matchesType && matchesCountry && matchesStatus;
    });
  }, [products, search, typeFilter, countryFilter, statusFilter]);

  // Type breakdown for stats
  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.status === "ACTIVE").length,
      draft: products.filter((p) => p.status === "DRAFT").length,
      byType: PRODUCT_TYPES.map((type) => ({
        type,
        count: products.filter((p) => p.type === type).length,
      })),
    };
  }, [products]);

  function handleStatusClick(id: string, currentStatus: "DRAFT" | "ACTIVE" | "INACTIVE") {
    startTransition(async () => {
      await cycleProductStatus(id, currentStatus);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProduct(id);
    });
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("ALL");
    setCountryFilter("ALL");
    setStatusFilter("ALL");
  }

  const hasActiveFilters =
    search || typeFilter !== "ALL" || countryFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <StatPill label="Total" value={stats.total} />
        <StatPill label="Active" value={stats.active} color="emerald" />
        <StatPill label="Draft" value={stats.draft} color="slate" />
        {stats.byType.map((s) => (
          <StatPill key={s.type} label={s.type.toLowerCase()} value={s.count} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-sm"
          >
            <option value="ALL">All Types</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-sm"
          >
            <option value="ALL">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flagEmoji} {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-sm"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Clear filters
            </button>
          )}

          {/* Add button */}
          <Link
            href="/products/new"
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {products.length === 0 ? (
              <>
                <p className="text-slate-600 font-medium mb-1">No products yet</p>
                <p className="text-sm text-slate-400 mb-4">
                  Add your first tour, excursion, activity, or transfer
                </p>
                <Link
                  href="/products/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add your first product
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium mb-1">No products match your filters</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-slate-900 hover:underline font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Country
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {product.coverImage ? (
                        <img
                          src={product.coverImage}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{product.name}</div>
                        {product.shortDesc && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[300px]">
                            {product.shortDesc}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <ProductTypeBadge type={product.type} />
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {product.countryFlag && product.countryName ? (
                      <span>
                        {product.countryFlag} {product.countryName}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {product.durationHours ? (
                      <span>{product.durationHours}h</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleStatusClick(product.id, product.status)}
                      disabled={isPending}
                      className="cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                      title="Click to cycle status"
                    >
                      <StatusBadge status={product.status} />
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={isPending}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {products.length > 0 && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          Showing {filtered.length} of {products.length} products
        </div>
      )}
    </>
  );
}

function StatPill({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: number;
  color?: "slate" | "emerald";
}) {
  const colors = {
    slate: "bg-white border-slate-200 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
