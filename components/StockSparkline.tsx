"use client";

import { TWSE_UP, TWSE_DOWN, TWSE_NEUTRAL } from "@/lib/constants";

interface StockSparklineProps {
  data: { price: number }[];
  trend?: "up" | "down" | "neutral";
  width?: number;
  height?: number;
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
  width = 100,
  height = 40,
}: StockSparklineProps) {
  const trend = forcedTrend ?? calcTrend(data);

  const color =
    trend === "up" ? TWSE_UP : trend === "down" ? TWSE_DOWN : TWSE_NEUTRAL;

  if (data.length === 0) {
    // Flat neutral line when no data
    return (
      <svg
        className="w-full h-full"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={TWSE_NEUTRAL}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1; // avoid division by zero

  // Map each price to (x, y) in viewBox coordinates
  const points = prices.map((price, i) => {
    const x = width * (i / (prices.length - 1 || 1));
    const y = height - ((price - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const d = `M${points.join(" L")}`;

  // Gradient fill below the line
  const gradientId = `sparkline-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      className="w-full h-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path
        d={`${d} V${height} H0 Z`}
        fill={`url(#${gradientId})`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
