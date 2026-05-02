"use client";

import { validateSymbol } from "@/lib/validation";
import { fetchStockPrice, type StockPrice } from "@/lib/yahoo-finance";
import { useCallback, useState, type KeyboardEvent } from "react";

export function useStockQuery() {
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);

  const handleQuery = useCallback(async () => {
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
  }, [symbol]);

  const handleSymbolKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") void handleQuery();
    },
    [handleQuery],
  );

  const onSymbolChange = useCallback((value: string) => {
    setSymbol(value);
    setSymbolError((prev) => (prev ? null : prev));
  }, []);

  return {
    symbol,
    stockData,
    setStockData,
    queryLoading,
    queryError,
    symbolError,
    handleQuery,
    handleSymbolKeyDown,
    onSymbolChange,
  };
}
