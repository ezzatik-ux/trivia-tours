"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
};

export function PaxCounter({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 50,
  disabled,
}: Props) {
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-slate-900 text-sm">{label}</p>
        {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => canDecrement && onChange(value - 1)}
          disabled={!canDecrement}
          className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
            canDecrement
              ? "border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
              : "border-slate-200 text-slate-300 cursor-not-allowed"
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => canIncrement && onChange(value + 1)}
          disabled={!canIncrement}
          className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
            canIncrement
              ? "border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
              : "border-slate-200 text-slate-300 cursor-not-allowed"
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
