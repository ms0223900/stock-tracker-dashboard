"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchStockPrice, type StockPrice } from "@/lib/yahoo-finance";
import { validateSymbol, validateTargetPrice } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import TopNavBar from "@/components/TopNavBar";
import SideNavBar from "@/components/SideNavBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import StockQueryForm from "@/components/StockQueryForm";
import StockResultCard from "@/components/StockResultCard";
import TargetPriceForm from "@/components/TargetPriceForm";
import TelegramInfoCard from "@/components/TelegramInfoCard";
import WatchlistCard from "@/components/WatchlistCard";
import NewsBanner from "@/components/NewsBanner";

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

  // ── Sparkline price histories ──
  const [priceHistories, setPriceHistories] = useState<Record<string, number[]>>({});

  const supabase = createClient();

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
          // Silently ignore
        }
      }

      // Update watchlist prices locally and accumulate price histories
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

        // Accumulate price histories for sparklines
        setPriceHistories((prev) => {
          const updated = { ...prev };
          for (const result of results) {
            if (result.status === "fulfilled") {
              const { id, price } = result.value;
              const history = updated[id] || [];
              updated[id] = [...history, price].slice(-20);
            }
          }
          return updated;
        });
      }
    }, POLL_INTERVAL_MS);

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

  return (
    <>
      <TopNavBar />
      <div className="flex max-w-[1280px] mx-auto min-h-[calc(100vh-64px)]">
        <SideNavBar />
        <main className="flex-1 p-lg lg:p-xl overflow-x-hidden pb-24 md:pb-lg">
          <StockQueryForm
            symbol={symbol}
            queryLoading={queryLoading}
            symbolError={symbolError}
            onSymbolChange={(v) => {
              setSymbol(v);
              if (symbolError) setSymbolError(null);
            }}
            onQuery={handleQuery}
            onKeyDown={handleSymbolKeyDown}
          />

          {(stockData || queryError) && (
            <div className="grid grid-cols-12 gap-lg mt-lg">
              <StockResultCard
                stockData={stockData}
                queryError={queryError}
              />

              {stockData && (
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
                  <TargetPriceForm
                    targetPrice={targetPrice}
                    targetPriceError={targetPriceError}
                    saving={saving}
                    saveError={saveError}
                    onTargetPriceChange={(v) => {
                      setTargetPrice(v);
                      if (targetPriceError) setTargetPriceError(null);
                    }}
                    onSave={handleSave}
                  />
                  <TelegramInfoCard />
                </div>
              )}

              <WatchlistCard
                watchlist={watchlist}
                watchlistLoading={watchlistLoading}
                deletingId={deletingId}
                priceHistories={priceHistories}
                onDelete={handleDelete}
              />

              <NewsBanner />
            </div>
          )}

          {!stockData && !queryError && (
            <div className="mt-lg">
              <WatchlistCard
                watchlist={watchlist}
                watchlistLoading={watchlistLoading}
                deletingId={deletingId}
                priceHistories={priceHistories}
                onDelete={handleDelete}
              />

              <div className="mt-lg">
                <NewsBanner />
              </div>
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </>
  );
}
