"use client";

import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatPrice } from "@/lib/format";
import type { ChartDataPoint } from "@/types/stock";

type StockChartProps = {
  chartData: ChartDataPoint[];
  updateTime: Date;
};

const TIME_PILLS = ["1D", "1M", "3M", "YTD", "1Y", "5Y"];
const CHART_GREEN = "#1fb86e";

type ChartRow = {
  time: number;
  price: number;
  label: string;
};

function toChartRows(data: ChartDataPoint[]): ChartRow[] {
  return data.map((point) => ({
    time: point.timestamp * 1000,
    price: point.price,
    label: new Date(point.timestamp * 1000).toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  }));
}

function getExtremes(data: ChartDataPoint[]) {
  if (data.length === 0) {
    return null;
  }

  let high = data[0];
  let low = data[0];

  for (const point of data) {
    if (point.price > high.price) {
      high = point;
    }
    if (point.price < low.price) {
      low = point;
    }
  }

  return { high, low };
}

export function StockChart({ chartData, updateTime }: StockChartProps) {
  if (chartData.length === 0) {
    return (
      <div className="mt-6 rounded-[14px] border border-border bg-card-muted p-4">
        <div className="flex h-[200px] items-center justify-center text-sm text-on-background-muted">
          尚無走勢資料
        </div>
      </div>
    );
  }

  const rows = toChartRows(chartData);
  const extremes = getExtremes(chartData);
  const highTime = extremes ? extremes.high.timestamp * 1000 : 0;
  const lowTime = extremes ? extremes.low.timestamp * 1000 : 0;

  return (
    <div className="mt-6 rounded-[14px] border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-on-background-muted">
          更新時間：{updateTime.toLocaleTimeString("zh-TW", { hour12: false })}
        </p>
        <div className="flex flex-wrap gap-1" aria-label="時間區間">
          {TIME_PILLS.map((pill) => (
            <span
              key={pill}
              className={
                pill === "1D"
                  ? "rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-on-background"
                  : "rounded-full px-2.5 py-1 text-[11px] text-on-background-muted"
              }
              aria-disabled={pill !== "1D"}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="stockAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_GREEN} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_GREEN} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value: number) =>
                new Date(value).toLocaleTimeString("zh-TW", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              }
              tick={{ fontSize: 10, fill: "#5f6368" }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value: number) => formatPrice(value)}
              tick={{ fontSize: 10, fill: "#5f6368" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value) => [
                formatPrice(typeof value === "number" ? value : Number(value)),
                "成交價",
              ]}
              labelFormatter={(label) =>
                new Date(Number(label)).toLocaleTimeString("zh-TW", {
                  hour12: false,
                })
              }
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={CHART_GREEN}
              strokeWidth={2.5}
              fill="url(#stockAreaFill)"
              dot={false}
              activeDot={{ r: 4, fill: CHART_GREEN }}
            />
            {extremes ? (
              <>
                <ReferenceLine
                  y={extremes.high.price}
                  stroke={CHART_GREEN}
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <ReferenceLine
                  y={extremes.low.price}
                  stroke={CHART_GREEN}
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <ReferenceDot
                  x={highTime}
                  y={extremes.high.price}
                  r={3.5}
                  fill={CHART_GREEN}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <ReferenceDot
                  x={lowTime}
                  y={extremes.low.price}
                  r={3.5}
                  fill={CHART_GREEN}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </>
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {extremes ? (
        <div className="mt-2 flex justify-between text-[11px] text-on-background-muted">
          <span>最高 {formatPrice(extremes.high.price)}</span>
          <span>最低 {formatPrice(extremes.low.price)}</span>
        </div>
      ) : null}
    </div>
  );
}
