"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { ChartDataPoint } from "@/types/stock";

type SparklineChartProps = {
  chartData: ChartDataPoint[];
};

const TWSE_UP = "#eb0000";
const TWSE_DOWN = "#008a3b";

function getTrendColor(data: ChartDataPoint[]): string {
  if (data.length < 2) {
    return TWSE_UP;
  }

  const first = data[0].price;
  const last = data.at(-1)?.price ?? first;
  return last >= first ? TWSE_UP : TWSE_DOWN;
}

export function SparklineChart({ chartData }: SparklineChartProps) {
  if (chartData.length === 0) {
    return (
      <div
        className="h-14 rounded-[10px] bg-card-muted"
        aria-hidden="true"
      />
    );
  }

  const rows = chartData.map((point) => ({
    time: point.timestamp,
    price: point.price,
  }));
  const color = getTrendColor(chartData);
  const gradientId = `sparkline-${color.replace("#", "")}`;

  return (
    <div className="h-14 w-full rounded-[10px] bg-card-muted">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
