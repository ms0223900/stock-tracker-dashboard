"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TWSE_UP, TWSE_DOWN, TWSE_NEUTRAL } from "@/lib/constants";

interface StockSparklineProps {
  data: { price: number }[];
  trend?: "up" | "down" | "neutral";
}

function calcTrend(data: { price: number }[]): "up" | "down" | "neutral" {
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
  const trend = forcedTrend ?? calcTrend(data);
  const color =
    trend === "up" ? TWSE_UP : trend === "down" ? TWSE_DOWN : TWSE_NEUTRAL;

  if (data.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg
          className="w-full"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <line
            x1={0}
            y1={20}
            x2={100}
            y2={20}
            stroke={TWSE_NEUTRAL}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
