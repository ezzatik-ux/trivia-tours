"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createSupplier, updateSupplier, type SupplierInput } from "./actions";
import { countryFlagEmoji } from "@/components/ui/country-flag";

type Country = {
  id: string;
  code: string | null;
  name: string;
};

type Supplier = SupplierInput & {
  id: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  existingSupplier?: Supplier | null;
};

export function SupplierFormModal({
  open,
  onClose,
  countries,
  existingSupplier,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const isEditing = !!existingSupplier;

  async function handleSubmit(formData: FormData) {
    setError(null);

    const input: SupplierInput = {
      name: formData.get("name") as string,
      countryId: (formData.get("countryId") as string) || null,
      contactName: formData.get("contactName") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactPhone: formData.get("contactPhone") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      notes: formData.get("notes") as string,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateSupplier(existingSupplier!.id, input)
        : await createSupplier(input);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="p-6 space-y-5">
          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Name (required) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={existingSupplier?.name ?? ""}
              placeholder="e.g., Cairo Tours Co."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              disabled={isPending}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Country
            </label>
            <select
              name="countryId"
              defaultValue={existingSupplier?.countryId ?? ""}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
              disabled={isPending}
            >
              <option value="">-- Select Country --</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {countryFlagEmoji(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Section */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contactName"
                  defaultValue={existingSupplier?.contactName ?? ""}
                  placeholder="Ahmed Mohamed"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  defaultValue={existingSupplier?.contactPhone ?? ""}
                  placeholder="+20 100 123 4567"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  disabled={isPending}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={existingSupplier?.contactEmail ?? ""}
                  placeholder="contact@supplier.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Business Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Payment Terms
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  defaultValue={existingSupplier?.paymentTerms ?? ""}
                  placeholder="e.g., Net 30, prepaid, 50% deposit"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={existingSupplier?.notes ?? ""}
                  placeholder="Any internal notes about this supplier..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
