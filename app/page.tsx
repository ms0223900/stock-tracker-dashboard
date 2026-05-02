"use client";

import MobileBottomNav from "@/components/MobileBottomNav";
import NewsBanner from "@/components/NewsBanner";
import SideNavBar from "@/components/SideNavBar";
import StockQueryForm from "@/components/StockQueryForm";
import StockResultCard from "@/components/StockResultCard";
import TargetPriceForm from "@/components/TargetPriceForm";
import TelegramInfoCard from "@/components/TelegramInfoCard";
import TopNavBar from "@/components/TopNavBar";
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
            onSymbolChange={onSymbolChange}
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
                    onTargetPriceChange={onTargetPriceChange}
                    onSave={() => handleSave(stockData)}
                  />
                  <TelegramInfoCard />
                </div>
              )}

              <WatchlistCard
                watchlist={watchlist}
                watchlistLoading={watchlistLoading}
                deletingId={deletingId}
                chartDataMap={chartDataMap}
                onDelete={handleDelete}
              />

              <NewsBanner />
            </div>
          )}

          {!stockData && !queryError && (
            <div className="grid grid-cols-12 gap-lg mt-lg">
              <WatchlistCard
                watchlist={watchlist}
                watchlistLoading={watchlistLoading}
                deletingId={deletingId}
                chartDataMap={chartDataMap}
                onDelete={handleDelete}
              />

              <NewsBanner />
            </div>
          )}
        </main>
      </div>
      <MobileBottomNav />
    </>
  );
}
