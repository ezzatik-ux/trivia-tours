"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  groups: { group: string; items: string[] }[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function AmenityPicker({ groups, selected, onChange }: Props) {
  function toggle(item: string) {
    onChange(
      selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item]
    );
  }

  // Surface any legacy free-text values not in the controlled list,
  // so existing hotels don't silently lose data.
  const known = new Set(groups.flatMap((g) => g.items));
  const legacy = selected.filter((s) => !known.has(s));

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.group}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {g.group}
          </p>
          <div className="flex flex-wrap gap-2">
            {g.items.map((item) => {
              const active = selected.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5",
                    active
                      ? "border-trivia-500 bg-trivia-50 text-trivia-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {legacy.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">
            Legacy (not in standard list)
          </p>
          <div className="flex flex-wrap gap-2">
            {legacy.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggle(item)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-300 bg-amber-50 text-amber-700 flex items-center gap-1.5"
                title="Click to remove this legacy value"
              >
                <Check className="w-3.5 h-3.5" />
                {item}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            These were typed before the standard list existed. Click to remove, or leave as-is.
          </p>
        </div>
      )}
    </div>
  );
}
