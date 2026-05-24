"use client";

import { useCallback } from "react";

import { ErrorBanner } from "@/components/ErrorBanner";
import { QueryAndTrackCard } from "@/components/QueryAndTrackCard";
import { StockResultCard } from "@/components/StockResultCard";
import { SuccessBanner } from "@/components/SuccessBanner";
import { useSaveWatchlist } from "@/hooks/useSaveWatchlist";
import { useStockQuery } from "@/hooks/useStockQuery";

export default function Home() {
  const { errorMessage: queryErrorMessage, stock, queryStock, isLoading } =
    useStockQuery();
  const {
    saveWatchlist,
    isSaving,
    errorMessage: saveErrorMessage,
    successMessage,
    clearMessages,
  } = useSaveWatchlist();

  const handleQuery = useCallback(
    (symbol: string) => {
      clearMessages();
      void queryStock(symbol);
    },
    [clearMessages, queryStock],
  );

  const handleSave = useCallback(
    (targetPrice: string) => {
      if (!stock) {
        return;
      }

      void saveWatchlist(stock.symbol, targetPrice);
    },
    [saveWatchlist, stock],
  );

  const bannerErrorMessage = saveErrorMessage ?? queryErrorMessage;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-on-background">股價看板</h1>
        <p className="mt-1 text-sm text-on-background-muted">
          查詢即時台股股價
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {successMessage ? <SuccessBanner message={successMessage} /> : null}
        {bannerErrorMessage ? (
          <ErrorBanner message={bannerErrorMessage} />
        ) : null}

        <QueryAndTrackCard isLoading={isLoading} onQuery={handleQuery} />

        {stock ? (
          <StockResultCard
            key={stock.symbol}
            stock={stock}
            isSaving={isSaving}
            onSave={handleSave}
          />
        ) : null}
      </div>
    </main>
  );
}
