import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {user.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-slate-500">
          You&apos;re signed in as <span className="font-medium text-slate-700">{user.role}</span>.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Your Role" value={user.role} description={getRoleDescription(user.role)} />
        <StatCard label="Status" value="Active" description="Full access to authorized features" />
        <StatCard
          label="Country Scope"
          value={user.countryScope.length === 0 ? "All Countries" : `${user.countryScope.length} countries`}
          description="Geographic areas you can manage"
        />
      </div>

      {/* Foundation Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">🚀 Platform Status</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>✅ Phase 1: Authentication &amp; Foundation</li>
          <li>🚧 Phase 2: Product Team Workspace (in progress)</li>
          <li>⏳ Phase 3: Sales Agent Workspace</li>
          <li>⏳ Phase 4: Operations Workspace</li>
          <li>⏳ Phase 5: Admin Dashboard</li>
        </ul>
      </div>
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
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
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
