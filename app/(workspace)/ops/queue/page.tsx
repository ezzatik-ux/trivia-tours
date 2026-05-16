import { requireRole } from "@/lib/auth-utils";
import {
  Inbox,
  UserCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { getOpsQueue, getOpsStats } from "./actions";
import { QueueTable } from "./queue-table";

export default async function OpsQueuePage() {
  const user = await requireRole(["OPS", "ADMIN"]);

  const [queue, stats] = await Promise.all([getOpsQueue(), getOpsStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Booking Queue</h1>
        <p className="text-slate-500 mt-1">Process incoming bookings and coordinate with suppliers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Sparkles}
          label="New Bookings"
          value={stats.newBookings}
          variant="blue"
        />
        <StatCard
          icon={Inbox}
          label="Unassigned"
          value={stats.unassigned}
          variant="slate"
        />
        <StatCard
          icon={UserCircle}
          label="My Active"
          value={stats.myAssigned}
          variant="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent (≤3 days)"
          value={stats.urgent}
          variant={stats.urgent > 0 ? "red" : "slate"}
        />
      </div>

      <QueueTable bookings={queue} currentUserId={user.id} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  variant: "blue" | "emerald" | "amber" | "red" | "slate";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
    slate: "bg-white border-slate-200",
  };
  const iconColors = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    slate: "text-slate-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[variant]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <Icon className={`w-4 h-4 ${iconColors[variant]}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
