import { auth, signOut } from "@/auth";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;
  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    SALES: "bg-blue-100 text-blue-700 border-blue-200",
    OPS: "bg-amber-100 text-amber-700 border-amber-200",
    PRODUCT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Trivia Tours</h1>
              <p className="text-xs text-slate-500">Internal Booking Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>

            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? "User"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-slate-200"
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
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome, {user.name?.split(" ")[0]} 👋
            </h2>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                roleColors[user.role] || "bg-slate-100 text-slate-700"
              }`}
            >
              {user.role}
            </span>
          </div>
          <p className="text-slate-500">
            You&apos;re successfully signed in to Trivia Tours.
          </p>
        </div>

        {/* Stats / Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Your Role"
            value={user.role}
            description={getRoleDescription(user.role)}
          />
          <StatCard
            label="Account Status"
            value="Active"
            description="You have full access to authorized features"
          />
          <StatCard
            label="Country Scope"
            value={
              user.countryScope.length === 0
                ? "All Countries"
                : `${user.countryScope.length} countries`
            }
            description="Geographic areas you can manage"
          />
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            🚀 System Foundation Complete
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✅ Authentication working</li>
            <li>✅ Database connected (Supabase)</li>
            <li>✅ 30 countries loaded</li>
            <li>✅ 10 categories ready</li>
            <li>⏳ Next: Product Team workspace</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
      <p className="text-sm text-slate-500 mt-2">{description}</p>
    </div>
  );
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    ADMIN: "Full system access including user management",
    SALES: "Search products, create quotes, manage bookings",
    OPS: "Process bookings, coordinate with suppliers",
    PRODUCT: "Upload tours, manage rates and images",
  };
  return descriptions[role] || "Standard user access";
}
