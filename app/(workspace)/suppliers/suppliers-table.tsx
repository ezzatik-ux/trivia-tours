"use client";

import { useState, useTransition } from "react";
import { Edit2, Plus, Search, Power, PowerOff } from "lucide-react";
import { SupplierFormModal } from "./supplier-form-modal";
import { toggleSupplierActive } from "./actions";

type Country = {
  id: string;
  name: string;
  flagEmoji: string | null;
};

type Supplier = {
  id: string;
  name: string;
  countryId: string | null;
  countryName: string | null;
  countryFlag: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  paymentTerms: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};

type Props = {
  suppliers: Supplier[];
  countries: Country[];
};

export function SuppliersTable({ suppliers, countries }: Props) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.countryName?.toLowerCase().includes(search.toLowerCase()) ||
      s.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditingSupplier(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingSupplier(null);
  }

  function handleToggleActive(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      await toggleSupplierActive(id, !currentlyActive);
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            {suppliers.length === 0 ? (
              <>
                <p className="text-slate-400 mb-2">No suppliers yet</p>
                <button
                  onClick={handleAdd}
                  className="text-sm font-medium text-slate-900 hover:underline"
                >
                  + Add your first supplier
                </button>
              </>
            ) : (
              <p className="text-slate-400">No suppliers match your search</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Supplier
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Country
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                  Payment Terms
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
              {filtered.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{supplier.name}</div>
                    {supplier.notes && (
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {supplier.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {supplier.countryFlag && supplier.countryName ? (
                      <span>
                        {supplier.countryFlag} {supplier.countryName}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {supplier.contactName ? (
                      <div>
                        <div className="text-slate-900">{supplier.contactName}</div>
                        {supplier.contactEmail && (
                          <div className="text-xs text-slate-500">{supplier.contactEmail}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {supplier.paymentTerms || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {supplier.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(supplier.id, supplier.isActive)}
                        disabled={isPending}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        title={supplier.isActive ? "Deactivate" : "Activate"}
                      >
                        {supplier.isActive ? (
                          <PowerOff className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Power className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats footer */}
      {suppliers.length > 0 && (
        <div className="mt-4 text-sm text-slate-500 text-center">
          {filtered.length} of {suppliers.length} suppliers •{" "}
          {suppliers.filter((s) => s.isActive).length} active
        </div>
      )}

      {/* Modal */}
      <SupplierFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        countries={countries}
        existingSupplier={editingSupplier}
      />
    </>
  );
}

