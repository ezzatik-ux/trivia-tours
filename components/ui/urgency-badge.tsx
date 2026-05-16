import { AlertTriangle, Clock } from "lucide-react";

type Props = {
  travelDate: string;
  status: string;
};

export function UrgencyBadge({ travelDate, status }: Props) {
  // Only show urgency for active bookings
  if (["CLOSED", "CANCELLED", "OPERATED"].includes(status)) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const travel = new Date(travelDate);
  travel.setHours(0, 0, 0, 0);

  const daysUntil = Math.floor((travel.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        <Clock className="w-3 h-3" />
        Past
      </span>
    );
  }

  // Critical: travel in 0-3 days and not confirmed
  const isCritical = daysUntil <= 3 && ["NEW", "ACK", "SUPPLIER_CONTACTED"].includes(status);

  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
      </span>
    );
  }

  // Warning: travel in 4-7 days
  if (daysUntil <= 7 && ["NEW", "ACK", "SUPPLIER_CONTACTED"].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
        <Clock className="w-3 h-3" />
        {daysUntil} days
      </span>
    );
  }

  // Just info
  return (
    <span className="text-xs text-slate-500">
      {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `in ${daysUntil} days`}
    </span>
  );
}
