import { signOut } from "@/auth";
import type { UserRole } from "@/lib/auth-utils";

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  SALES: "bg-blue-100 text-blue-700 border-blue-200",
  OPS: "bg-amber-100 text-amber-700 border-amber-200",
  PRODUCT: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function Topbar({
  name,
  email,
  image,
  role,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="px-8 py-3 flex items-center justify-between">
        <div /> {/* Spacer */}

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <p className="text-sm font-medium text-slate-900">{name}</p>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${roleColors[role]}`}
              >
                {role}
              </span>
            </div>
            <p className="text-xs text-slate-500">{email}</p>
          </div>

          {image && (
            <img
              src={image}
              alt={name ?? "User"}
              className="w-9 h-9 rounded-full border-2 border-slate-200"
            />
          )}

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
