"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, Plus, Edit, Trash2, Ban, CheckCircle2, Users as UsersIcon } from "lucide-react";
import { UserFormModal } from "./user-form-modal";
import { deleteUser, toggleUserActive, type UserRole } from "./actions";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  countryScope: string[] | null;
  createdAt: Date;
  image: string | null;
  isActive: boolean;
};
type Country = { id: string; code: string; name: string; flagEmoji: string | null };
type Props = { users: User[]; countries: Country[]; currentUserId: string };

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  OPS: "bg-amber-100 text-amber-700 border-amber-200",
  PRODUCT: "bg-blue-100 text-blue-700 border-blue-200",
  SALES: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function UsersTable({ users, countries, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchesSearch =
          !search ||
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [users, search, roleFilter]
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.role === "ADMIN").length,
      ops: users.filter((u) => u.role === "OPS").length,
      product: users.filter((u) => u.role === "PRODUCT").length,
      sales: users.filter((u) => u.role === "SALES").length,
    }),
    [users]
  );

  function handleEdit(user: User) {
    setEditingUser(user);
    setModalOpen(true);
  }
  function handleAdd() {
    setEditingUser(null);
    setModalOpen(true);
  }
  function handleDeleteConfirm() {
    if (!confirmDelete) return;
    startTransition(async () => {
      const result = await deleteUser(confirmDelete.id, currentUserId);
      if (result.success) setConfirmDelete(null);
      else alert(result.error || "Failed to delete user");
    });
  }
  function handleToggleConfirm() {
    if (!confirmToggle) return;
    startTransition(async () => {
      const result = await toggleUserActive(
        confirmToggle.id,
        currentUserId,
        !confirmToggle.isActive
      );
      if (result.success) setConfirmToggle(null);
      else alert(result.error || "Failed to update status");
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatPill label="Total Users" value={stats.total} />
        <StatPill label="Admin" value={stats.admin} color="red" />
        <StatPill label="Ops" value={stats.ops} color="amber" />
        <StatPill label="Product" value={stats.product} color="blue" />
        <StatPill label="Sales" value={stats.sales} color="emerald" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-trivia-500/30 focus:border-trivia-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm"
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="OPS">Ops</option>
            <option value="PRODUCT">Product</option>
            <option value="SALES">Sales</option>
          </select>
          <button
            onClick={handleAdd}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No users match your filters</p>
            <p className="text-sm text-slate-400">
              {users.length === 0 ? "Add your first user to get started" : "Try different filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Country Access</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Joined</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isCurrentUser = u.id === currentUserId;
                  const scopeCount = u.countryScope?.length ?? 0;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.image} alt={u.name ?? ""} className="w-9 h-9 rounded-full" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-trivia-100 text-trivia-700 flex items-center justify-center font-semibold text-xs">
                              {getInitials(u.name, u.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className={`font-medium flex items-center gap-1.5 ${u.isActive ? "text-slate-900" : "text-slate-400"}`}>
                              {u.name ?? "Unnamed"}
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 bg-trivia-50 text-trivia-700 text-[10px] rounded font-bold">YOU</span>
                              )}
                              {!u.isActive && (
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded font-bold">INACTIVE</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${ROLE_BADGE_COLORS[u.role] ?? "bg-slate-100 text-slate-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {scopeCount === 0 ? (
                          <span className="text-xs text-slate-500 italic">All countries</span>
                        ) : (
                          <span className="text-xs">{scopeCount} {scopeCount === 1 ? "country" : "countries"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(u)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => setConfirmToggle(u)}
                              className={`p-1.5 rounded-md ${u.isActive ? "hover:bg-amber-50 text-slate-500 hover:text-amber-700" : "hover:bg-emerald-50 text-slate-500 hover:text-emerald-700"}`}
                              title={u.isActive ? "Deactivate" : "Reactivate"}
                            >
                              {u.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {!isCurrentUser && (
                            <button onClick={() => setConfirmDelete(u)} className="p-1.5 hover:bg-red-50 rounded-md text-slate-500 hover:text-red-700" title="Delete permanently">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        countries={countries}
        currentUserId={currentUserId}
        editingUser={
          editingUser
            ? {
                id: editingUser.id,
                name: editingUser.name ?? "",
                email: editingUser.email,
                role: editingUser.role as UserRole,
                countryScope: editingUser.countryScope ?? [],
              }
            : null
        }
      />

      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmToggle.isActive ? "Deactivate user?" : "Reactivate user?"}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {confirmToggle.isActive ? (
                <>
                  <strong>{confirmToggle.name ?? confirmToggle.email}</strong> will lose access immediately and won&apos;t be able to sign in. Their data and history stay intact. You can reactivate them anytime.
                </>
              ) : (
                <>
                  <strong>{confirmToggle.name ?? confirmToggle.email}</strong> will regain access and be able to sign in again.
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmToggle(null)} disabled={isPending} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleToggleConfirm}
                disabled={isPending}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 ${confirmToggle.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {isPending ? "Saving..." : confirmToggle.isActive ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete user?</h3>
            <p className="text-sm text-slate-600 mb-4">
              This permanently removes <strong>{confirmDelete.name ?? confirmDelete.email}</strong> from the platform. They lose access immediately. Booking history remains but unassigned.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} disabled={isPending} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={isPending} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                {isPending ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatPill({ label, value, color = "default" }: { label: string; value: number; color?: "default" | "red" | "amber" | "blue" | "emerald" }) {
  const colors = {
    default: "bg-white border-slate-200 text-slate-900",
    red: "bg-red-50 border-red-200 text-red-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
