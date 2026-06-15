"use client";

import { createClient } from "@/lib/supabase/client";
import {
  normalizeWatchlistNote,
  validateTargetPrice,
  validateWatchlistNote,
} from "@/lib/validation";
import type { StockPrice } from "@/lib/yahoo-finance";
import type { WatchlistItem } from "@/types/watchlist";
import { useCallback, useState } from "react";

const PRICE_NEAR_EPS = 0.01;

function pricesNearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < PRICE_NEAR_EPS;
}

/** 輪詢只更新記憶體時，DB `last_price` 可能仍為昨收；refetch 時保留較可信的即時價。 */
function mergeWatchlistFromDb(prev: WatchlistItem[], fromDb: WatchlistItem[]): WatchlistItem[] {
  if (prev.length === 0) return fromDb;

  return fromDb.map((row) => {
    const old = prev.find((p) => p.id === row.id);
    if (
      old &&
      old.previousClose != null &&
      row.last_price != null &&
      old.last_price != null &&
      pricesNearlyEqual(row.last_price, old.previousClose) &&
      !pricesNearlyEqual(old.last_price, row.last_price)
    ) {
      return {
        ...row,
        last_price: old.last_price,
        previousClose: old.previousClose,
      };
    }
    return row;
  });
}

export function useWatchlist() {
  const [targetPrice, setTargetPrice] = useState("");
  const [targetPriceError, setTargetPriceError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);
  const [noteUpdateErrors, setNoteUpdateErrors] = useState<Record<string, string>>({});

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
      const items = (data as WatchlistItem[]).map((row) => ({
        ...row,
        currency: row.currency ?? "TWD",
        previousClose: row.previousClose ?? null,
        note: row.note ?? null,
      }));
      let merged: WatchlistItem[] = items;
      setWatchlist((prev) => {
        merged = mergeWatchlistFromDb(prev, items);
        return merged;
      });
      setWatchlistLoading(false);
      return merged;
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
        currency: stockData.currency,
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

  const handleUpdateNote = useCallback(
    async (id: string, value: string): Promise<string | null | false> => {
      const validation = validateWatchlistNote(value);
      if (!validation.valid) {
        setNoteUpdateErrors((prev) => ({
          ...prev,
          [id]: validation.error ?? "備註格式無效",
        }));
        return false;
      }

      const normalized = normalizeWatchlistNote(value);
      setUpdatingNoteId(id);
      setNoteUpdateErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      const { error } = await supabase
        .from("watchlist")
        .update({
          note: normalized,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        setNoteUpdateErrors((prev) => ({
          ...prev,
          [id]: `備註儲存失敗，請稍後再試：${error.message}`,
        }));
        setUpdatingNoteId(null);
        return false;
      }

      setWatchlist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, note: normalized } : item)),
      );
      setUpdatingNoteId(null);
      return normalized;
    },
    [supabase],
  );

  const clearNoteUpdateError = useCallback((id: string) => {
    setNoteUpdateErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
    updatingNoteId,
    noteUpdateErrors,
    handleUpdateNote,
    clearNoteUpdateError,
  };
}
