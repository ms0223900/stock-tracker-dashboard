"use client";

import { useCallback, useEffect, useState } from "react";

import { getWatchlistItems } from "@/app/actions/watchlist";
import { WATCHLIST_FETCH_ERROR } from "@/lib/constants";
import type { WatchlistItemDisplay } from "@/types/watchlist";

type LoadState = "idle" | "loading" | "success" | "error";

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItemDisplay[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationErrorMessage, setNotificationErrorMessage] = useState<
    string | null
  >(null);

  const fetchWatchlist = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const result = await getWatchlistItems();

      if (!result.ok) {
        setItems([]);
        setLoadState("error");
        setErrorMessage(result.message);
        return false;
      }

      setItems(result.items);
      setLoadState("success");
      return true;
    } catch {
      setItems([]);
      setLoadState("error");
      setErrorMessage(WATCHLIST_FETCH_ERROR);
      return false;
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const response = await fetch("/api/check-prices", { method: "POST" });
      const payload = (await response.json()) as {
        items?: WatchlistItemDisplay[];
        error?: string;
        notificationError?: string | null;
      };

      if (!response.ok || !payload.items) {
        setLoadState("error");
        setErrorMessage(payload.error ?? WATCHLIST_FETCH_ERROR);
        setNotificationErrorMessage(null);
        return;
      }

      setItems(payload.items);
      setLoadState("success");
      setErrorMessage(null);
      setNotificationErrorMessage(payload.notificationError ?? null);
    } catch {
      setLoadState("error");
      setErrorMessage(WATCHLIST_FETCH_ERROR);
      setNotificationErrorMessage(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const loaded = await fetchWatchlist();
      if (loaded) {
        await refreshPrices();
      }
    })();
  }, [fetchWatchlist, refreshPrices]);

  return {
    items,
    loadState,
    errorMessage,
    notificationErrorMessage,
    fetchWatchlist,
    refreshPrices,
    isLoading: loadState === "loading",
  };
}
