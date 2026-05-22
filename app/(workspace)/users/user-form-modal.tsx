"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, User, Mail, Shield, Globe, Check } from "lucide-react";
import { createUser, updateUser, type UserRole } from "./actions";

type Country = { id: string; code: string; name: string; flagEmoji: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  currentUserId: string;
  editingUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    countryScope: string[];
  } | null;
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Full platform access. Manages users, settings, everything.",
  OPS: "Operations team. Manages booking queues, contacts hotels.",
  PRODUCT: "Catalog management. Uploads hotels, tours, rates.",
  SALES: "Sales agent. Searches catalog, creates bookings.",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-50 border-red-200 text-red-800",
  OPS: "bg-amber-50 border-amber-200 text-amber-800",
  PRODUCT: "bg-blue-50 border-blue-200 text-blue-800",
  SALES: "bg-emerald-50 border-emerald-200 text-emerald-800",
};

export function UserFormModal({ open, onClose, countries, currentUserId, editingUser }: Props) {
  const router = useRouter();
  const isEdit = !!editingUser;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("SALES");
  const [scope, setScope] = useState<string[]>([]);
  const [allCountries, setAllCountries] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sync form whenever the modal opens or the target user changes
  useEffect(() => {
    if (open) {
      setName(editingUser?.name ?? "");
      setEmail(editingUser?.email ?? "");
      setRole(editingUser?.role ?? "SALES");
      setScope(editingUser?.countryScope ?? []);
      setAllCountries(!editingUser?.countryScope?.length);
      setError(null);
    }
  }, [open, editingUser]);

  const isEditingSelf = isEdit && editingUser?.id === currentUserId;

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const finalScope = allCountries ? [] : scope;
      const result = isEdit
        ? await updateUser(editingUser!.id, { name, role, countryScope: finalScope })
        : await createUser({ name, email, role, countryScope: finalScope });
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error || "Operation failed");
      }
    });
  }

  function toggleCountry(id: string) {
    setScope((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50">
      <div className="bg-white md:rounded-2xl rounded-t-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit User" : "Add New User"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? "Update details and permissions" : "Invite a team member"}
            </p>
          </div>
          <button onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Catherine [Lastname]"
                required
                disabled={isPending}
                className="form-input pl-9"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="catherine@triviaeg.com"
                  required
                  disabled={isPending}
                  className="form-input pl-9 lowercase"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Must match their Google account email exactly.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["ADMIN", "OPS", "PRODUCT", "SALES"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => !isEditingSelf && setRole(r)}
                  disabled={isPending || isEditingSelf}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    role === r ? ROLE_COLORS[r] + " shadow-sm" : "border-slate-200 hover:border-slate-300"
                  } ${isEditingSelf ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm">{r}</div>
                    {role === r && <Check className="w-4 h-4" />}
                  </div>
                  <div className="text-[10px] mt-1 leading-snug">{ROLE_DESCRIPTIONS[r]}</div>
                </button>
              ))}
            </div>
            {isEditingSelf && (
              <p className="text-xs text-amber-600 mt-2">
                You can&apos;t change your own role. Ask another admin to do it.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              <Globe className="w-3.5 h-3.5 inline mr-1" />
              Country Access
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setAllCountries(!allCountries)}
                disabled={isPending}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  allCountries ? "border-trivia-500 bg-trivia-50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">All Countries</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Access to products from all destinations
                    </div>
                  </div>
                  {allCountries && (
                    <div className="w-5 h-5 rounded-full bg-trivia-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {!allCountries && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {countries.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCountry(c.id)}
                      disabled={isPending}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        scope.includes(c.id)
                          ? "bg-trivia-50 text-trivia-700 ring-1 ring-trivia-300"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span>{c.flagEmoji}</span>
                      <span className="truncate">{c.name}</span>
                      {scope.includes(c.id) && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 sticky bottom-0 bg-white -mx-6 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-trivia-500 hover:bg-trivia-600 rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
