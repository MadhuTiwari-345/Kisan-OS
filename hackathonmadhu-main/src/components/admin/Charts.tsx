"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#c084fc", "#a855f7", "#d946ef", "#c629ff",
  "#a4f0a3", "#6ee7b7", "#cc3352", "#f472b6",
];

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartWrapper({ title, subtitle, children }: ChartWrapperProps) {
  return (
    <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10">
      <div className="mb-5">
        <h3 className="text-[15px] font-bold tracking-tight text-white">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-[12px] text-white/35">{subtitle}</p>
        )}
      </div>
      <div className="h-[280px] w-full">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(15,15,25,0.95)",
  boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.4)",
  fontSize: 12,
  padding: "8px 12px",
  color: "#e0e0e0",
};

interface LineChartComponentProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  yLabel?: string;
}

export function LineChartComponent({
  data,
  xKey,
  yKey,
  yLabel,
}: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "rgba(255,255,255,0.3)" } }
              : undefined
          }
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey={yKey}
          stroke="#c084fc"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#c084fc", stroke: "#0c0c14", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BarChartComponentProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
}

export function BarChartComponent({
  data,
  xKey,
  yKey,
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={yKey} fill="#c084fc" radius={[6, 6, 0, 0]} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartComponentProps {
  data: { name: string; value: number }[];
}

export function PieChartComponent({ data }: PieChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
