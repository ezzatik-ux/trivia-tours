type Status = "DRAFT" | "ACTIVE" | "INACTIVE";

const statusConfig: Record<Status, { label: string; color: string }> = {
  DRAFT: {
    label: "Draft",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  ACTIVE: {
    label: "Active",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  INACTIVE: {
    label: "Inactive",
    color: "bg-red-50 text-red-700 border-red-200",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === "ACTIVE" ? "bg-emerald-500" :
        status === "DRAFT" ? "bg-slate-400" : "bg-red-500"
      }`} />
      {config.label}
    </span>
  );
}
