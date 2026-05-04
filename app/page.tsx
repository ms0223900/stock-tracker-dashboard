"use client";

import DashboardHeader from "@/components/DashboardHeader";
import ErrorBanner from "@/components/ErrorBanner";
import QueryAndTrackCard from "@/components/QueryAndTrackCard";
import StockResultCard from "@/components/StockResultCard";
import WatchlistCard from "@/components/WatchlistCard";
import { useStockQuery } from "@/hooks/useStockQuery";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchlistPolling } from "@/hooks/useWatchlistPolling";

export default function HomePage() {
  const {
    symbol,
    stockData,
    setStockData,
    queryLoading,
    queryError,
    symbolError,
    handleQuery,
    handleSymbolKeyDown,
    onSymbolChange,
  } = useStockQuery();

  const {
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
  } = useWatchlist();

  const { chartDataMap } = useWatchlistPolling({
    fetchWatchlist,
    stockData,
    setStockData,
    watchlist,
    setWatchlist,
  });

  /** 顯著錯誤：API 查價失敗、Supabase 儲存失敗（驗證錯誤於欄位下方顯示） */
  const topBanner = queryError ?? saveError ?? null;

  return (
    <div className="min-h-screen bg-background text-on-background pb-10">
      <DashboardHeader />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 flex flex-col gap-6">
        {topBanner ? <ErrorBanner message={topBanner} /> : null}

        <QueryAndTrackCard
          symbol={symbol}
          queryLoading={queryLoading}
          symbolError={symbolError}
          onSymbolChange={onSymbolChange}
          onQuery={handleQuery}
          onSymbolKeyDown={handleSymbolKeyDown}
        />

        <StockResultCard
          stockData={stockData}
          queryError={queryError}
          queryLoading={queryLoading}
          targetPrice={targetPrice}
          targetPriceError={targetPriceError}
          saving={saving}
          onTargetPriceChange={onTargetPriceChange}
          onSave={() => handleSave(stockData)}
        />

        <WatchlistCard
          watchlist={watchlist}
          watchlistLoading={watchlistLoading}
          deletingId={deletingId}
          chartDataMap={chartDataMap}
          onDelete={handleDelete}
        />

        <footer className="pt-5 text-center">
          <p className="text-xs text-on-surface-variant">
            資料僅供課程 Demo · 非投資建議
          </p>
        </footer>
      </div>
    </div>
  );
}
