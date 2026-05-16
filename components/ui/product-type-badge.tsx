import type { ComponentType } from "react";
import { Compass, MapPin, Activity, Car } from "lucide-react";

type ProductType = "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER";

const typeConfig: Record<
  ProductType,
  { label: string; color: string; icon: ComponentType<{ className?: string }> }
> = {
  TOUR: {
    label: "Tour",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Compass,
  },
  EXCURSION: {
    label: "Excursion",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: MapPin,
  },
  ACTIVITY: {
    label: "Activity",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Activity,
  },
  TRANSFER: {
    label: "Transfer",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Car,
  },
};

export function ProductTypeBadge({ type }: { type: ProductType }) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
