import { History, ArrowRight } from "lucide-react";
import { BookingStatusBadge } from "@/components/ui/booking-status-badge";

type HistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedAt: Date | null;
  changedByName: string | null;
  changedByEmail: string | null;
};

type Props = {
  history: HistoryItem[];
};

export function StatusHistory({ history }: Props) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-slate-900">Status History</h2>
      </div>

      <div className="p-6">
        <ol className="relative border-l-2 border-slate-200 ml-3">
          {history.map((item, idx) => (
            <li key={item.id} className="mb-6 last:mb-0 ml-6">
              {/* Dot */}
              <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 bg-white rounded-full">
                <span className="w-3 h-3 rounded-full bg-slate-900" />
              </span>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.fromStatus ? (
                    <>
                      <BookingStatusBadge status={item.fromStatus as Parameters<typeof BookingStatusBadge>[0]["status"]} />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </>
                  ) : null}
                  <BookingStatusBadge status={item.toStatus as Parameters<typeof BookingStatusBadge>[0]["status"]} />
                </div>

                {item.note && (
                  <p className="text-sm text-slate-700 mb-2">{item.note}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>by {item.changedByName ?? item.changedByEmail ?? "Unknown"}</span>
                  <span>·</span>
                  <span>
                    {item.changedAt
                      ? new Date(item.changedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
