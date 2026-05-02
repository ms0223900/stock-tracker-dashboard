"use client";

import { createClient } from "@/lib/supabase/client";
import { validateTargetPrice } from "@/lib/validation";
import type { StockPrice } from "@/lib/yahoo-finance";
import type { WatchlistItem } from "@/types/watchlist";
import { useCallback, useState } from "react";

export function useWatchlist() {
  const [targetPrice, setTargetPrice] = useState("");
  const [targetPriceError, setTargetPriceError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  /** Returns fetched rows after success; `null` on error (state unchanged). */
  const fetchWatchlist = useCallback(async (): Promise<WatchlistItem[] | null> => {
    setWatchlistLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch watchlist:", error.message);
      setWatchlistLoading(false);
      return null;
    }

    if (data) {
      const items = data as WatchlistItem[];
      setWatchlist(items);
      setWatchlistLoading(false);
      return items;
    }

    setWatchlistLoading(false);
    return [];
  }, [supabase]);

  const handleSave = useCallback(
    async (stockData: StockPrice | null) => {
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
    },
    [fetchWatchlist, supabase, targetPrice],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      const { error } = await supabase.from("watchlist").delete().eq("id", id);

      if (error) {
        console.error("Delete failed:", error.message);
      }

      setDeletingId(null);
      await fetchWatchlist();
    },
    [fetchWatchlist, supabase],
  );

  const onTargetPriceChange = useCallback((value: string) => {
    setTargetPrice(value);
    setTargetPriceError((prev) => (prev ? null : prev));
  }, []);

  return {
    watchlist,
    setWatchlist,
    watchlistLoading,
    fetchWatchlist,
    targetPrice,
    targetPriceError,
    saving,
    saveError,
    deletingId,
    handleSave,
    handleDelete,
    onTargetPriceChange,
  };
}
