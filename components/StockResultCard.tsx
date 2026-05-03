"use client";

import { useMemo } from "react";

import { TWSE_DOWN, TWSE_NEUTRAL, TWSE_UP } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { StockPrice } from "@/lib/yahoo-finance";
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

const CHART_PERIODS = ["1D", "1M", "3M", "YTD", "1Y", "5Y"] as const;

type ChartRow = { idx: number; time: Date; price: number };

interface StockResultCardProps {
  stockData: StockPrice | null;
  queryError: string | null;
}

export default function StockResultCard({
  stockData,
  queryError,
}: StockResultCardProps) {
  const chartSeries: ChartRow[] = useMemo(() => {
    if (!stockData?.chartData?.length) return [];
    return stockData.chartData.map((p, idx) => ({
      idx,
      time: p.time,
      price: p.price,
    }));
  }, [stockData]);

  const { avgPrice, maxEntry, minEntry } = useMemo(() => {
    if (chartSeries.length === 0) {
      return {
        avgPrice: 0,
        maxEntry: null as ChartRow | null,
        minEntry: null as ChartRow | null,
      };
    }
    const sum = chartSeries.reduce((s, d) => s + d.price, 0);
    const maxEntry = chartSeries.reduce((a, b) => (b.price > a.price ? b : a));
    const minEntry = chartSeries.reduce((a, b) => (b.price < a.price ? b : a));
    return {
      avgPrice: sum / chartSeries.length,
      maxEntry,
      minEntry,
    };
  }, [chartSeries]);

  const gradientId = useMemo(() => {
    if (!stockData) return "price-area";
    return `price-area-${stockData.symbol.replace(/[^a-zA-Z0-9]/g, "-")}-${stockData.updatedAt.getTime()}`;
  }, [stockData]);

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

  const formatUpdatedLabel = (date: Date) =>
    date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

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
          {chartSeries.length === 0 ? (
            <span className="text-body-sm text-outline">
              更新於 {formatTime(stockData.updatedAt)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Chart */}
      {chartSeries.length > 0 && maxEntry && minEntry && (
        <div className="mb-lg rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-sm px-md pt-md pb-sm">
            <p className="text-[11px] text-on-surface-variant shrink-0">
              上次更新：{formatUpdatedLabel(stockData.updatedAt)}
            </p>
            <div
              className="flex items-center gap-0.5 text-on-surface-variant text-xs"
              role="group"
              aria-label="圖表區間（課程版僅 1D 有資料）"
            >
              {CHART_PERIODS.map((p) => (
                <span
                  key={p}
                  className={
                    p === "1D"
                      ? "px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold"
                      : "px-2 py-1 rounded-full opacity-60"
                  }
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="h-56 w-full md:h-64 px-2 pb-md">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartSeries}
                margin={{ top: 28, right: 8, left: 8, bottom: 4 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="idx" type="number" hide domain={["dataMin", "dataMax"]} />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-container-lowest)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--color-on-surface)",
                  }}
                  labelFormatter={(_, payload) => {
                    const t = payload?.[0]?.payload?.time;
                    if (t instanceof Date) {
                      return t.toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });
                    }
                    return "";
                  }}
                  formatter={(value) => {
                    const v = Number(value);
                    return [
                      `$${v.toLocaleString("zh-TW", { minimumFractionDigits: 2 })}`,
                      "價格",
                    ];
                  }}
                />
                <ReferenceLine
                  y={avgPrice}
                  stroke="var(--color-outline-variant)"
                  strokeDasharray="4 4"
                  label={{
                    value: "AVG",
                    position: "insideLeft",
                    fill: "var(--color-on-surface-variant)",
                    fontSize: 11,
                  }}
                />
                <ReferenceLine
                  y={maxEntry.price}
                  stroke="var(--color-outline-variant)"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{ r: 5, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
                />
                <ReferenceDot
                  x={maxEntry.idx}
                  y={maxEntry.price}
                  r={4}
                  fill={lineColor}
                  stroke="#fff"
                  strokeWidth={2}
                  label={{
                    value: formatPrice(maxEntry.price),
                    position: "top",
                    fill: "var(--color-on-surface-variant)",
                    fontSize: 11,
                  }}
                />
                <ReferenceDot
                  x={minEntry.idx}
                  y={minEntry.price}
                  r={4}
                  fill={lineColor}
                  stroke="#fff"
                  strokeWidth={2}
                  label={{
                    value: formatPrice(minEntry.price),
                    position: "bottom",
                    fill: "var(--color-on-surface-variant)",
                    fontSize: 11,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="px-md pb-sm text-[11px] text-on-surface-variant">
            當日走勢 · Recharts AreaChart · Yahoo Finance
          </p>
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
