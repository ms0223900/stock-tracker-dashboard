"use client";

import { TWSE_DOWN, TWSE_NEUTRAL, TWSE_UP } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { StockPrice } from "@/lib/yahoo-finance";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StockResultCardProps {
  stockData: StockPrice | null;
  queryError: string | null;
}

export default function StockResultCard({
  stockData,
  queryError,
}: StockResultCardProps) {
  // Error state
  if (queryError) {
    return (
      <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {queryError}
        </div>
      </div>
    );
  }

  // Empty state (no query yet)
  if (!stockData) return null;

  const isUp =
    stockData.previousClose !== null &&
    stockData.currentPrice >= stockData.previousClose;
  const lineColor = isUp ? TWSE_UP : stockData.previousClose !== null ? TWSE_DOWN : TWSE_NEUTRAL;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("zh-TW", { hour12: false });

  const formatNumber = (n: number) => n.toLocaleString("zh-TW");

  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg overflow-hidden relative">
      {/* Company info + price */}
      <div className="flex justify-between items-start mb-lg">
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <h1 className="text-headline-md font-semibold">
              {stockData.symbol}
            </h1>
            <span className="px-3 py-1 bg-surface-container-highest text-primary text-label-caps font-semibold rounded-full">
              Semiconductors
            </span>
          </div>
          <p className="text-outline font-body-sm">Taiwan Stock Exchange</p>
        </div>
        <div className="text-right">
          <p
            className={`text-display-lg font-semibold ${isUp ? "text-twse-up" : "text-twse-down"}`}
          >
            {formatPrice(stockData.currentPrice)}
          </p>
          {stockData.change !== null && stockData.changePercent !== null && (
            <div
              className={`flex items-center justify-end gap-xs ${isUp ? "text-twse-up" : "text-twse-down"}`}
            >
              <span className="material-symbols-outlined text-sm">
                {isUp ? "trending_up" : "trending_down"}
              </span>
              <span className="text-data-mono">
                {stockData.change > 0 ? "+" : ""}
                {stockData.change.toFixed(2)} (
                {stockData.changePercent > 0 ? "+" : ""}
                {stockData.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
          <span className="text-body-sm text-outline">
            Updated at {formatTime(stockData.updatedAt)}
          </span>
        </div>
      </div>

      {/* Chart */}
      {stockData.chartData.length > 0 && (
        <div className="h-48 w-full mb-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
              <XAxis
                dataKey="time"
                tickFormatter={(t: Date) =>
                  t.toLocaleTimeString("zh-TW", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                }
                stroke="#717783"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#717783"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => v.toLocaleString("zh-TW")}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #c1c6d4",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#071e27",
                }}
                labelFormatter={(t) => {
                  if (t instanceof Date) {
                    return t.toLocaleTimeString("zh-TW", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });
                  }
                  return String(t);
                }}
                formatter={(value) => {
                  const v = Number(value);
                  return [
                    `$${v.toLocaleString("zh-TW", { minimumFractionDigits: 2 })}`,
                    "Price",
                  ];
                }}
              />
              {stockData.previousClose !== null && (
                <ReferenceLine
                  y={stockData.previousClose}
                  stroke="#717783"
                  strokeDasharray="4 4"
                  label={{
                    value: `Prev Close ${formatPrice(stockData.previousClose)}`,
                    fill: "#717783",
                    fontSize: 12,
                    position: "insideTopRight",
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* OHLC grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md border-t border-outline-variant pt-md">
        <div>
          <p className="text-label-caps text-outline mb-xs">OPEN</p>
          <p className="text-data-mono text-title-sm">
            {formatPrice(stockData.open)}
          </p>
        </div>
        <div>
          <p className="text-label-caps text-outline mb-xs">HIGH</p>
          <p className="text-data-mono text-title-sm text-twse-up">
            {formatPrice(stockData.high)}
          </p>
        </div>
        <div>
          <p className="text-label-caps text-outline mb-xs">LOW</p>
          <p className="text-data-mono text-title-sm text-twse-down">
            {formatPrice(stockData.low)}
          </p>
        </div>
        <div>
          <p className="text-label-caps text-outline mb-xs">VOLUME</p>
          <p className="text-data-mono text-title-sm">
            {formatNumber(stockData.volume)}
          </p>
        </div>
      </div>
    </div>
  );
}
