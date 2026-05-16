import { auth } from "@/auth";
import { signOut } from "@/auth";
import { NotificationBell } from "./notification-bell";
import { LogOut } from "lucide-react";

const roleStyles: Record<string, string> = {
  ADMIN: "bg-trivia-50 text-trivia-700 border-trivia-200",
  OPS: "bg-amber-50 text-amber-700 border-amber-200",
  SALES: "bg-blue-50 text-blue-700 border-blue-200",
  PRODUCT: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export async function Topbar() {
  const session = await auth();
  const user = session?.user;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between md:justify-end px-4 md:px-6 py-3 gap-4">
        {/* Mobile logo (hidden on desktop, sidebar shows it) */}
        <div className="md:hidden">
          {/* MobileMenuButton lives separately if needed */}
        </div>

        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <NotificationBell currentUserId={user.id!} />

          {/* User pill */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm font-semibold text-slate-900">
                  {user.name?.split(" ")[0] || user.email}
                </span>
                {user.role && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border ${
                      roleStyles[user.role] ?? "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {user.role}
                  </span>
                )}
              </div>
              {user.email && (
                <p className="hidden md:block text-xs text-slate-500 mt-0.5">{user.email}</p>
              )}
            </div>
          </div>

          {/* Sign out */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              title="Sign out"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-trivia-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
