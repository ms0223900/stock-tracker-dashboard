"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { fetchStockPrice, type StockPrice } from "@/lib/yahoo-finance";
import { formatPrice } from "@/lib/format";
import { validateSymbol, validateTargetPrice } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

interface WatchlistItem {
  id: string;
  symbol: string;
  target_price: number;
  last_price: number | null;
  previousClose: number | null;
  is_notified: boolean;
  created_at: string;
}

export default function HomePage() {
  // ── Stock query states ──
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);

  // ── Watchlist states ──
  const [targetPrice, setTargetPrice] = useState("");
  const [targetPriceError, setTargetPriceError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  // ── Derived line color ──
  const lineColor =
    stockData === null || stockData.previousClose === null
      ? "#a1a1aa"
      : stockData.currentPrice >= stockData.previousClose
        ? "#22c55e"
        : "#ef4444";

  // ── Fetch watchlist on mount ──
  const fetchWatchlist = useCallback(async () => {
    setWatchlistLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch watchlist:", error.message);
    } else if (data) {
      setWatchlist(data as WatchlistItem[]);
    }
    setWatchlistLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // ── Auto-poll every 60 seconds ──
  const stockDataRef = useRef(stockData);
  stockDataRef.current = stockData;
  const watchlistRef = useRef(watchlist);
  watchlistRef.current = watchlist;

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentSymbol = stockDataRef.current?.symbol;

      // Silently re-fetch current stock price
      if (currentSymbol) {
        try {
          const data = await fetchStockPrice(currentSymbol);
          setStockData(data);
        } catch {
          // Silently ignore — don't show errors during auto-refresh
        }
      }

      // Update watchlist prices locally
      const items = watchlistRef.current;
      if (items.length > 0) {
        const results = await Promise.allSettled(
          items.map((item) =>
            fetchStockPrice(item.symbol).then((d) => ({
              id: item.id,
              price: d.currentPrice,
              previousClose: d.previousClose,
            })),
          ),
        );
        setWatchlist((prev) =>
          prev.map((item) => {
            const result = results.find(
              (r) => r.status === "fulfilled" && r.value.id === item.id,
            );
            if (result?.status === "fulfilled") {
              return {
                ...item,
                last_price: result.value.price,
                previousClose: result.value.previousClose,
              };
            }
            return item;
          }),
        );
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // ── Stock query handler ──
  const handleQuery = async () => {
    const symResult = validateSymbol(symbol);
    setSymbolError(symResult.error);
    if (!symResult.valid) return;

    setQueryLoading(true);
    setQueryError(null);
    setStockData(null);

    try {
      const data = await fetchStockPrice(symbol.trim().toUpperCase());
      setStockData(data);
    } catch (err) {
      setQueryError(
        err instanceof Error
          ? err.message
          : "目前無法取得股價資料，請稍後再試",
      );
    } finally {
      setQueryLoading(false);
    }
  };

  // ── Save to watchlist handler ──
  const handleSave = async () => {
    const priceResult = validateTargetPrice(targetPrice);
    setTargetPriceError(priceResult.error);
    if (!priceResult.valid) return;

    if (!stockData) return;

    setSaving(true);
    setSaveError(null);

    const { error } = await supabase.from("watchlist").insert({
      symbol: stockData.symbol,
      target_price: Number(targetPrice),
      last_price: stockData.currentPrice,
    });

    if (error) {
      setSaveError(`儲存失敗：${error.message}`);
      setSaving(false);
      return;
    }

    setTargetPrice("");
    setSaving(false);
    await fetchWatchlist();
  };

  // ── Delete watchlist item ──
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (error) {
      console.error("Delete failed:", error.message);
    }

    setDeletingId(null);
    await fetchWatchlist();
  };

  // ── Handle Enter key ──
  const handleSymbolKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleQuery();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("zh-TW", { hour12: false });

  const formatNumber = (n: number) => n.toLocaleString("zh-TW");

  return (
    <main className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[480px] w-[480px] rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12 sm:py-16">
        {/* ── Header ── */}
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            股價投資看板
          </h1>
          <p className="text-zinc-400">
            輸入台股代號查詢即時股價，設定目標價並追蹤。
          </p>
        </header>

        {/* ── Stock Query Section ── */}
        <section
          aria-labelledby="stock-query"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur-sm"
        >
          <h2 id="stock-query" className="sr-only">
            股價查詢
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label htmlFor="symbol-input" className="sr-only">
                股票代號
              </label>
              <input
                id="symbol-input"
                type="text"
                placeholder="輸入股票代號，例如 2330.TW"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  if (symbolError) setSymbolError(null);
                }}
                onKeyDown={handleSymbolKeyDown}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
              />
              {symbolError && (
                <p className="mt-1.5 text-sm text-red-400">{symbolError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleQuery}
              disabled={queryLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {queryLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  查詢中...
                </>
              ) : (
                "查詢股價"
              )}
            </button>
          </div>

          {/* ── Error message ── */}
          {queryError && (
            <p className="mt-4 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
              {queryError}
            </p>
          )}

          {/* ── Stock price display ── */}
          {stockData && (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-xl font-semibold text-white">
                  {stockData.symbol}
                </span>
                <span className="text-3xl font-bold text-white">
                  {formatPrice(stockData.currentPrice)}
                </span>
                {stockData.previousClose !== null && stockData.change !== null && stockData.changePercent !== null && (
                  <span
                    className={`text-lg font-medium ${
                      stockData.change > 0
                        ? "text-emerald-400"
                        : stockData.change < 0
                          ? "text-red-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {stockData.change > 0 ? "+" : ""}$
                    {stockData.change.toFixed(2)} (
                    {stockData.changePercent > 0 ? "+" : ""}
                    {stockData.changePercent.toFixed(2)}%)
                  </span>
                )}
                <span className="text-sm text-zinc-500">
                  更新於 {formatTime(stockData.updatedAt)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">開盤</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {formatPrice(stockData.open)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">最高</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {formatPrice(stockData.high)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">最低</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {formatPrice(stockData.low)}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 p-3">
                  <p className="text-xs text-zinc-500">成交量</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {formatNumber(stockData.volume)}
                  </p>
                </div>
              </div>

              {/* ── Price chart ── */}
              {stockData.chartData.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="mb-3 text-sm font-medium text-zinc-400">
                    當日走勢
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={stockData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="time"
                        tickFormatter={(t: Date) =>
                          t.toLocaleTimeString("zh-TW", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        }
                        stroke="#71717a"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        stroke="#71717a"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v: number) => v.toLocaleString("zh-TW")}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #27272a",
                          borderRadius: "8px",
                          fontSize: "14px",
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
                            "股價",
                          ];
                        }}
                      />
                      {stockData.previousClose !== null && (
                        <ReferenceLine
                          y={stockData.previousClose}
                          stroke="#71717a"
                          strokeDasharray="4 4"
                          label={{
                            value: `昨收 ${formatPrice(stockData.previousClose)}`,
                            fill: "#71717a",
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

              {/* ── Save to watchlist ── */}
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="target-price" className="text-sm text-zinc-400">
                      目標股價
                    </label>
                    <input
                      id="target-price"
                      type="text"
                      placeholder="例如 2200"
                      value={targetPrice}
                      onChange={(e) => {
                        setTargetPrice(e.target.value);
                        if (targetPriceError) setTargetPriceError(null);
                      }}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    />
                    {targetPriceError && (
                      <p className="mt-1 text-sm text-red-400">
                        {targetPriceError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-5 py-2.5 font-medium text-white transition-colors hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "儲存中..." : "儲存追蹤"}
                  </button>
                </div>
                {saveError && (
                  <p className="mt-2 text-sm text-red-400">{saveError}</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Watchlist Section ── */}
        <section
          aria-labelledby="watchlist"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur-sm"
        >
          <h2
            id="watchlist"
            className="text-lg font-semibold text-white"
          >
            追蹤清單
          </h2>

          {watchlistLoading ? (
            <p className="mt-4 text-sm text-zinc-500">載入中...</p>
          ) : watchlist.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              尚未加入任何追蹤項目。查詢股價後輸入目標價即可儲存。
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-2 pr-4 font-medium">股票代號</th>
                    <th className="pb-2 pr-4 font-medium">目標價</th>
                    <th className="pb-2 pr-4 font-medium">目前股價</th>
                    <th className="pb-2 pr-4 font-medium">通知</th>
                    <th className="pb-2 pr-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-800/50 text-white last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium">{item.symbol}</td>
                      <td className="py-3 pr-4">
                        {formatPrice(item.target_price)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            item.previousClose !== null && item.last_price !== null
                              ? item.last_price >= item.previousClose
                                ? "text-emerald-400"
                                : "text-red-400"
                              : "text-white"
                          }
                        >
                          {formatPrice(item.last_price)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {item.is_notified ? (
                          <span className="text-emerald-400">已通知</span>
                        ) : (
                          <span className="text-zinc-500">等待中</span>
                        )}
                      </td>
                      <td className="py-3 pr-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-sm text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === item.id ? "刪除中..." : "刪除"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
