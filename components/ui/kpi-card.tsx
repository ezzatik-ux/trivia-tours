import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "emerald" | "blue" | "amber";
};

export function KpiCard({
  label,
  value,
  change,
  changeLabel = "vs prev period",
  icon: Icon,
  variant = "default",
}: Props) {
  const variants = {
    default: "bg-white border-slate-200",
    emerald: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
  };

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isZero = change === 0;

  return (
    <div className={`rounded-2xl border p-5 ${variants[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>

      <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-semibold ${
              isPositive
                ? "text-emerald-700"
                : isNegative
                ? "text-red-700"
                : "text-slate-500"
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isZero && <Minus className="w-3 h-3" />}
            {isPositive && "+"}
            {change.toFixed(1)}%
          </span>
          <span className="text-slate-500">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
