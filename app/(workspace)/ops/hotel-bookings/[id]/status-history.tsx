"use client";

import { History, User } from "lucide-react";

type HistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedAt: Date;
  changedByName: string | null;
};

type Props = {
  history: HistoryEntry[];
};

function formatTimestamp(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StatusHistory({ history }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-slate-900">Activity</h3>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">No history yet</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry, idx) => (
            <div key={entry.id} className="flex gap-3 relative">
              {/* Vertical line connector */}
              {idx < history.length - 1 && (
                <div className="absolute left-3.5 top-7 bottom-0 w-px bg-slate-200" />
              )}

              {/* Dot */}
              <div className="w-7 h-7 rounded-full bg-trivia-100 border-2 border-trivia-300 flex-shrink-0 flex items-center justify-center z-10">
                <User className="w-3 h-3 text-trivia-700" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900">
                    {entry.changedByName ?? "Unknown"}
                  </span>
                  <span className="text-xs text-slate-500" title={formatTimestamp(entry.changedAt)}>
                    · {timeAgo(entry.changedAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-0.5">
                  {entry.fromStatus ? (
                    <>
                      changed status from{" "}
                      <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                        {entry.fromStatus.replace(/_/g, " ")}
                      </span>{" "}
                      to{" "}
                      <span className="font-mono text-xs bg-trivia-100 text-trivia-800 px-1.5 py-0.5 rounded font-medium">
                        {entry.toStatus.replace(/_/g, " ")}
                      </span>
                    </>
                  ) : (
                    <>
                      created the booking with status{" "}
                      <span className="font-mono text-xs bg-trivia-100 text-trivia-800 px-1.5 py-0.5 rounded font-medium">
                        {entry.toStatus.replace(/_/g, " ")}
                      </span>
                    </>
                  )}
                </p>
                {entry.note && (
                  <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 px-2.5 py-1.5 rounded border-l-2 border-slate-300">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
