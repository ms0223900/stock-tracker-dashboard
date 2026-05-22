"use client";

import { ErrorBanner } from "@/components/ErrorBanner";
import { QueryAndTrackCard } from "@/components/QueryAndTrackCard";
import { StockResultCard } from "@/components/StockResultCard";
import { useStockQuery } from "@/hooks/useStockQuery";

export default function Home() {
  const { errorMessage, stock, queryStock, isLoading } = useStockQuery();

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-6 py-10 sm:px-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-on-background">股價看板</h1>
        <p className="mt-1 text-sm text-on-background-muted">
          查詢即時台股股價
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <QueryAndTrackCard isLoading={isLoading} onQuery={queryStock} />

        {stock ? <StockResultCard stock={stock} /> : null}
      </div>
    </main>
  );
}
