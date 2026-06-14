"use client";

import { useMemo } from "react";

import { formatPrice, formatVolumeCompact } from "@/lib/format";
import {
  twseMovementHex,
  twseMovementTextClass,
  twseMovementTrendIcon,
  twseQuoteHeadlineTextClass,
} from "@/lib/twse-display";
import { getTwseMovement, type StockPrice } from "@/lib/yahoo-finance";
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
  queryLoading: boolean;
  targetPrice: string;
  targetPriceError: string | null;
  saving: boolean;
  onTargetPriceChange: (value: string) => void;
  onSave: () => void;
}

export default function StockResultCard({
  stockData,
  queryError,
  queryLoading,
  targetPrice,
  targetPriceError,
  saving,
  onTargetPriceChange,
  onSave,
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

  const formatUpdatedLabel = (date: Date) =>
    date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  // 頂部錯誤改由 ErrorBanner；此處不重複顯示 queryError
  if (queryError) return null;

  if (queryLoading && !stockData) {
    return (
      <section className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-7 min-h-[200px] flex flex-col items-center justify-center gap-3">
        <svg
          className="h-8 w-8 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-sm text-on-surface-variant">查詢股價中…</p>
      </section>
    );
  }

  if (!stockData) {
    return (
      <section className="w-full rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest/80 p-6 sm:p-7">
        <p className="text-sm text-on-surface-variant text-center leading-relaxed">
          尚無報價。請輸入完整代號（例如 2330.TW）後按「查詢股價」。
        </p>
      </section>
    );
  }

  const movement = getTwseMovement(stockData.currentPrice, stockData.previousClose);
  const lineColor = twseMovementHex(movement);
  const headlinePriceClass = twseQuoteHeadlineTextClass(
    movement,
    stockData.previousClose !== null,
  );
  const changeRowClass = twseMovementTextClass(movement);
  const changeIcon = twseMovementTrendIcon(movement);

  const saveDisabled = saving;

  return (
    <section className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-7 overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            {stockData.symbol}
          </h2>
          <p className="mt-1.5 text-[13px] text-on-surface-variant">
            更新時間 · {formatUpdatedLabel(stockData.updatedAt)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3.5 sm:w-auto sm:max-w-[min(100%,420px)] sm:items-end">
          <div className="text-left sm:text-right shrink-0">
            <p
              className={`text-3xl sm:text-[36px] font-bold tabular-nums leading-none ${headlinePriceClass}`}
            >
              {formatPrice(stockData.currentPrice, stockData.currency)}
            </p>
            <p className="mt-1 text-[13px] text-on-surface-variant">{"TWD"}</p>
            {stockData.change !== null && stockData.changePercent !== null && (
              <div
                className={`mt-2 flex flex-wrap items-center gap-1 sm:justify-end text-sm font-medium tabular-nums ${changeRowClass}`}
              >
                <span className="material-symbols-outlined text-base" aria-hidden>
                  {changeIcon}
                </span>
                <span>
                  {stockData.change > 0 ? "+" : ""}
                  {stockData.change.toFixed(2)}（
                  {stockData.changePercent > 0 ? "+" : ""}
                  {stockData.changePercent.toFixed(2)}%）
                </span>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-end sm:gap-3">
            <div className="w-full min-w-0 sm:w-[200px] sm:shrink-0">
              <label
                htmlFor="target-price"
                className="block text-[13px] font-semibold text-on-surface mb-2 sm:text-right"
              >
                目標股價
              </label>
              <input
                id="target-price"
                className="h-12 w-full rounded-[14px] border border-outline-variant bg-surface-container-low px-[18px] text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
                placeholder="0"
                type="number"
                min={0}
                step="any"
                value={targetPrice}
                onChange={(e) => onTargetPriceChange(e.target.value)}
              />
              {targetPriceError ? (
                <p className="mt-1.5 text-sm text-error sm:text-right">{targetPriceError}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-outline-variant bg-secondary-container px-6 text-[15px] font-semibold text-on-surface hover:opacity-95 transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden>
                notifications_active
              </span>
              {saving ? "儲存中…" : "儲存目標股價"}
            </button>
          </div>
        </div>
      </div>

      {chartSeries.length > 0 && maxEntry && minEntry && (
        <div className="mt-5 rounded-[14px] border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-2">
            <p className="text-[11px] text-on-surface-variant shrink-0">
              上次更新：{formatUpdatedLabel(stockData.updatedAt)}
            </p>
            <div
              className="flex flex-wrap items-center gap-0.5 text-on-surface-variant text-xs"
              role="group"
              aria-label="圖表區間（課程版僅 1D 有資料）"
            >
              {CHART_PERIODS.map((p) => (
                <span
                  key={p}
                  className={
                    p === "1D"
                      ? "px-2.5 py-1 rounded-full bg-secondary-container text-on-surface font-semibold"
                      : "px-2 py-1 rounded-full opacity-60"
                  }
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="h-48 w-full sm:h-52 px-2 pb-2">
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
                    borderRadius: "12px",
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
                    return [formatPrice(v, stockData.currency), "價格"];
                  }}
                />
                <ReferenceLine
                  y={avgPrice}
                  stroke="var(--color-chart-grid)"
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
                  stroke="var(--color-chart-grid)"
                  strokeDasharray="4 4"
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={lineColor}
                  strokeWidth={2.5}
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
                    value: formatPrice(maxEntry.price, stockData.currency),
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
                    value: formatPrice(minEntry.price, stockData.currency),
                    position: "bottom",
                    fill: "var(--color-on-surface-variant)",
                    fontSize: 11,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="px-4 pb-3 text-xs text-on-surface-variant">
            當日走勢（示意）· Recharts AreaChart · Yahoo Finance
          </p>
          <p className="px-4 pb-3 text-[11px] text-on-surface-variant -mt-2">
            漲跌視覺遵循台股紅漲綠跌
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            ["最高", formatPrice(stockData.high, stockData.currency), "text-twse-up"],
            ["最低", formatPrice(stockData.low, stockData.currency), "text-twse-down"],
            ["開盤", formatPrice(stockData.open, stockData.currency), "text-on-surface"],
            ["成交量", formatVolumeCompact(stockData.volume), "text-on-surface"],
          ] as const
        ).map(([label, value, valueClass]) => (
          <div
            key={label}
            className="rounded-[14px] bg-surface-container-low px-3.5 py-3.5"
          >
            <p className="text-xs text-on-surface-variant mb-1">{label}</p>
            <p className={`text-base font-semibold tabular-nums ${valueClass}`}>{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
