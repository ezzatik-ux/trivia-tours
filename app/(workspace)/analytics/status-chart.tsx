"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  ACK: "#06b6d4",
  SUPPLIER_CONTACTED: "#f59e0b",
  CONFIRMED: "#10b981",
  VOUCHER_ISSUED: "#a855f7",
  OPERATED: "#059669",
  CLOSED: "#64748b",
  CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  ACK: "Acknowledged",
  SUPPLIER_CONTACTED: "Supplier Contacted",
  CONFIRMED: "Confirmed",
  VOUCHER_ISSUED: "Voucher Issued",
  OPERATED: "Operated",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

type Props = {
  data: Array<{ status: string; count: number }>;
};

export function StatusChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-slate-400 text-sm">
        No data for this period
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    status: d.status,
    value: d.count,
  }));

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "12px",
            }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              return [`${num} bookings`, ""];
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((entry) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={entry.status} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[entry.status] }}
              />
              <span className="text-slate-700 truncate">{entry.name}</span>
              <span className="text-slate-500 ml-auto">{entry.value} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
