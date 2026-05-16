"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

type Props = {
  data: Array<{ month: string; revenue: number; bookings: number }>;
};

export function RevenueChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-slate-400 text-sm">
        No revenue data yet
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: new Date(d.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    revenue: d.revenue,
    bookings: d.bookings,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "12px",
          }}
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : Number(value ?? 0);
            if (name === "revenue") return [`$${num.toLocaleString()}`, "Revenue"];
            return [num, "Bookings"];
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0f172a"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={{ fill: "#0f172a", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
