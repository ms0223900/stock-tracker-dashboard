"use client";

import { POLL_INTERVAL_MS } from "@/lib/constants";
import { fetchStockPrice, type ChartPoint, type StockPrice } from "@/lib/yahoo-finance";
import type { WatchlistItem } from "@/types/watchlist";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
          previousClose: d.previousClose,
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
          return {
            ...item,
            last_price: result.value.price,
            previousClose: result.value.previousClose,
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
