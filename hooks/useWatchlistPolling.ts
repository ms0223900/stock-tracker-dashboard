"use client";

import { POLL_INTERVAL_MS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import {
  fetchStockPrice,
  isAmbiguousPrevCloseSnapshot,
  type ChartPoint,
  type StockPrice,
} from "@/lib/yahoo-finance";
import type { WatchlistItem } from "@/types/watchlist";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const CHECK_PRICES_LOG_PREFIX = "[check-prices]";

type CheckPricesResponse = {
  ok?: boolean;
  error?: string;
  detail?: string;
  message?: string;
  results?: string[];
};

function isCheckPricesFailureLine(line: string): boolean {
  return (
    line.includes("failed") ||
    line.includes("error") ||
    line.includes("LINE failed")
  );
}

async function triggerCheckPricesWithLogging(): Promise<void> {
  try {
    const res = await fetch("/api/check-prices");
    const text = await res.text();

    let body: CheckPricesResponse | null = null;
    try {
      body = JSON.parse(text) as CheckPricesResponse;
    } catch {
      body = null;
    }

    if (!res.ok) {
      console.error(
        CHECK_PRICES_LOG_PREFIX,
        "HTTP 錯誤:",
        res.status,
        body ?? text,
      );
      return;
    }

    const failures = (body?.results ?? []).filter(isCheckPricesFailureLine);
    if (failures.length > 0) {
      console.warn(
        CHECK_PRICES_LOG_PREFIX,
        "達標但未成功通知:",
        failures,
      );
    }
  } catch (err) {
    console.error(CHECK_PRICES_LOG_PREFIX, "請求失敗:", err);
  }
}

interface UseWatchlistPollingParams {
  fetchWatchlist: () => Promise<WatchlistItem[] | null>;
  stockData: { symbol: string } | null;
  setStockData: Dispatch<SetStateAction<StockPrice | null>>;
  watchlist: WatchlistItem[];
  setWatchlist: Dispatch<SetStateAction<WatchlistItem[]>>;
}

export function useWatchlistPolling({
  fetchWatchlist,
  stockData,
  setStockData,
  watchlist,
  setWatchlist,
}: UseWatchlistPollingParams) {
  const [chartDataMap, setChartDataMap] = useState<Record<string, ChartPoint[]>>({});
  const supabase = createClient();

  const stockDataRef = useRef(stockData);
  const watchlistRef = useRef(watchlist);

  useLayoutEffect(() => {
    stockDataRef.current = stockData;
    watchlistRef.current = watchlist;
  }, [stockData, watchlist]);

  const pollWatchlist = async () => {
    const currentSymbol = stockDataRef.current?.symbol;

    if (currentSymbol) {
      try {
        const data = await fetchStockPrice(currentSymbol);
        setStockData(data);
      } catch {
        // Silently ignore
      }
    }

    const items = watchlistRef.current;
    if (items.length === 0) return;

    const results = await Promise.allSettled(
      items.map((item) =>
        fetchStockPrice(item.symbol).then((d) => ({
          id: item.id,
          price: d.currentPrice,
          currency: d.currency,
          previousClose: d.previousClose,
          hasRegularMarketPriceFromMeta: d.hasRegularMarketPriceFromMeta,
          chartData: d.chartData,
        })),
      ),
    );

    setWatchlist((prev) =>
      prev.map((item) => {
        const result = results.find(
          (r) => r.status === "fulfilled" && r.value.id === item.id,
        );
        if (result?.status === "fulfilled") {
          const v = result.value;
          let nextLast = v.price;
          if (
            isAmbiguousPrevCloseSnapshot({
              hasRegularMarketPriceFromMeta: v.hasRegularMarketPriceFromMeta,
              currentPrice: v.price,
              previousClose: v.previousClose,
            }) &&
            item.last_price != null &&
            Math.abs(item.last_price - v.price) >= 0.01
          ) {
            nextLast = item.last_price;
          }
          void supabase
            .from("watchlist")
            .update({
              last_price: nextLast,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);
          return {
            ...item,
            last_price: nextLast,
            previousClose: v.previousClose,
            currency: v.currency ?? item.currency ?? "TWD",
          };
        }
        return item;
      }),
    );

    setChartDataMap((prev) => {
      const updated = { ...prev };
      for (const result of results) {
        if (result.status === "fulfilled") {
          updated[result.value.id] = result.value.chartData;
        }
      }
      return updated;
    });

    // Fire-and-forget: trigger server-side target check & Telegram notification
    void triggerCheckPricesWithLogging();
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const init = async () => {
      const fetched = await fetchWatchlist();
      if (fetched !== null) {
        watchlistRef.current = fetched;
      }
      await pollWatchlist();
      interval = setInterval(pollWatchlist, POLL_INTERVAL_MS);
    };

    void init();

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only bootstrap + polling
  }, []);

  return { chartDataMap };
}
