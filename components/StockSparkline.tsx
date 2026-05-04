"use client";

import { twseMovementHex } from "@/lib/twse-display";
import type { ChartPoint } from "@/lib/yahoo-finance";
import { useId, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface StockSparklineProps {
  data: ChartPoint[];
  trend?: "up" | "down" | "neutral";
}

function calcTrend(data: ChartPoint[]): "up" | "down" | "neutral" {
  if (data.length < 2) return "neutral";
  const first = data[0].price;
  const last = data[data.length - 1].price;
  if (last > first) return "up";
  if (last < first) return "down";
  return "neutral";
}

export default function StockSparkline({
  data,
  trend: forcedTrend,
}: StockSparklineProps) {
  const uid = useId().replace(/:/g, "");
  const trend = forcedTrend ?? calcTrend(data);
  const color = twseMovementHex(trend);

  const series = useMemo(
    () => data.map((d, idx) => ({ idx, price: d.price })),
    [data],
  );

  const gradId = `spark-grad-${uid}`;

  if (data.length < 2) {
    return (
      <div className="w-full h-14 flex items-center justify-center rounded-[10px] bg-surface-container-lowest border border-outline-variant/60">
        <svg className="w-full max-h-5 px-2" viewBox="0 0 100 24" preserveAspectRatio="none">
          <line
            x1={0}
            y1={12}
            x2={100}
            y2={12}
            stroke={twseMovementHex("neutral")}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            opacity={0.35}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full h-14 rounded-[10px] bg-surface-container-lowest border border-outline-variant/60 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="idx" type="number" hide domain={["dataMin", "dataMax"]} />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
