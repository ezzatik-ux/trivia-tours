import { auth } from "@/auth";
import { signOut } from "@/auth";
import { NotificationBell } from "./notification-bell";

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  OPS: "bg-amber-100 text-amber-700 border-amber-200",
  SALES: "bg-blue-100 text-blue-700 border-blue-200",
  PRODUCT: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export async function Topbar() {
  const session = await auth();
  const user = session?.user;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-end px-6 py-3 gap-4">
        <NotificationBell currentUserId={user.id!} />

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-medium text-slate-900">
                {user.name?.split(" ")[0] || user.email}
              </span>
              {user.role && (
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    roleColors[user.role] ?? "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {user.role}
                </span>
              )}
            </div>
            {user.email && (
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
