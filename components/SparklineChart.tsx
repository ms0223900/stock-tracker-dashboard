"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { ChartDataPoint } from "@/types/stock";

type SparklineChartProps = {
  chartData: ChartDataPoint[];
  symbol: string;
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

export function SparklineChart({ chartData, symbol }: SparklineChartProps) {
  const reactId = useId();
  const gradientId = `sparkline-${symbol.replace(/\W/g, "")}-${reactId.replace(/:/g, "")}`;

  if (chartData.length === 0) {
    return (
      <div
        className="h-14 rounded-[10px] bg-card-muted"
        aria-label={`${symbol} 尚無走勢資料`}
      />
    );
  }

  const rows = chartData.map((point, index) => ({
    index,
    price: point.price,
  }));
  const color = getTrendColor(chartData);

  return (
    <div
      className="h-14 w-full overflow-hidden rounded-[10px] bg-card-muted"
      aria-label={`${symbol} 當日走勢`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={rows}
          margin={{ top: 6, right: 4, left: 4, bottom: 6 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="index"
            type="number"
            domain={["dataMin", "dataMax"]}
            hide
            padding={{ left: 0, right: 0 }}
          />
          <YAxis
            domain={["dataMin", "dataMax"]}
            hide
            width={0}
            padding={{ top: 4, bottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
            baseValue="dataMin"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
