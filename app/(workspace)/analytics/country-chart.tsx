"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: Array<{
    countryName: string | null;
    countryFlag: string | null;
    bookings: number;
    revenue: number;
  }>;
};

export function CountryChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-slate-400 text-sm">
        No country data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: `${d.countryFlag ?? ""} ${d.countryName ?? "Unknown"}`,
    revenue: d.revenue,
    bookings: d.bookings,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(250, data.length * 36)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#1e293b" }}
          axisLine={false}
          tickLine={false}
          width={120}
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
        <Bar dataKey="revenue" fill="#0f172a" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
