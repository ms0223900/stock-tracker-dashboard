"use client";

import { useCallback, useState } from "react";

import { STOCK_FETCH_ERROR } from "@/lib/constants";
import { deserializeStockPrice } from "@/lib/yahoo-finance";
import { validateSymbol } from "@/lib/validation";
import type { StockPrice } from "@/types/stock";

type QueryState = "idle" | "loading" | "success" | "error";

export function useStockQuery() {
  const [queryState, setQueryState] = useState<QueryState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stock, setStock] = useState<StockPrice | null>(null);

  const queryStock = useCallback(async (symbolInput: string) => {
    const validation = validateSymbol(symbolInput);

    if (!validation.ok) {
      setQueryState("error");
      setErrorMessage(validation.message);
      setStock(null);
      return;
    }

    setQueryState("loading");
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/yahoo-finance?symbol=${encodeURIComponent(validation.symbol)}`,
      );
      const payload = (await response.json()) as {
        data?: Parameters<typeof deserializeStockPrice>[0];
        error?: string;
      };

      if (!response.ok || !payload.data) {
        setQueryState("error");
        setErrorMessage(payload.error ?? STOCK_FETCH_ERROR);
        setStock(null);
        return;
      }

      setStock(deserializeStockPrice(payload.data));
      setQueryState("success");
    } catch {
      setQueryState("error");
      setErrorMessage(STOCK_FETCH_ERROR);
      setStock(null);
    }
  }, []);

  const refreshCurrentStock = useCallback(async () => {
    if (!stock) {
      return;
    }

    try {
      const response = await fetch(
        `/api/yahoo-finance?symbol=${encodeURIComponent(stock.symbol)}`,
      );
      const payload = (await response.json()) as {
        data?: Parameters<typeof deserializeStockPrice>[0];
        error?: string;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.error ?? STOCK_FETCH_ERROR);
        return;
      }

      setStock(deserializeStockPrice(payload.data));
      setErrorMessage(null);
    } catch {
      setErrorMessage(STOCK_FETCH_ERROR);
    }
  }, [stock]);

  return {
    queryState,
    errorMessage,
    stock,
    queryStock,
    refreshCurrentStock,
    isLoading: queryState === "loading",
  };
}
