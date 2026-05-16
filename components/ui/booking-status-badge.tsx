type Status =
  | "NEW"
  | "ACK"
  | "SUPPLIER_CONTACTED"
  | "CONFIRMED"
  | "VOUCHER_ISSUED"
  | "OPERATED"
  | "CLOSED"
  | "CANCELLED";

const config: Record<Status, { label: string; bg: string; dot: string }> = {
  NEW: { label: "New", bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  ACK: { label: "Acknowledged", bg: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  SUPPLIER_CONTACTED: {
    label: "Supplier Contacted",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  VOUCHER_ISSUED: {
    label: "Voucher Issued",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  OPERATED: {
    label: "Operated",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-600",
  },
  CLOSED: { label: "Closed", bg: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

export function BookingStatusBadge({ status }: { status: Status }) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${c.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
