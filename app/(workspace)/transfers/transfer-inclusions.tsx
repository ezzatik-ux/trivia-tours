import { Lock, Plane, Handshake, Luggage } from "lucide-react";

const INCLUSIONS = [
  { icon: Lock, text: "Rate is known straight away and does not change" },
  { icon: Plane, text: "1 hour of free waiting time after landing" },
  { icon: Handshake, text: "Meet & Greet at the airport" },
  { icon: Luggage, text: "Assistance with luggage to the car" },
];

export function TransferInclusions({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
        {INCLUSIONS.map((inc, i) => (
          <span key={i} className="flex items-center gap-1">
            <inc.icon className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            {inc.text}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {INCLUSIONS.map((inc, i) => (
        <div key={i} className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <inc.icon className="w-4 h-4 text-slate-700" />
          </div>
          <span className="text-xs text-slate-600 leading-snug">{inc.text}</span>
        </div>
      ))}
    </div>
  );
}
