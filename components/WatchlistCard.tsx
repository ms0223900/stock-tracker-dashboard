"use client";

import { formatPrice } from "@/lib/format";
import StockSparkline from "./StockSparkline";

interface WatchlistItem {
  id: string;
  symbol: string;
  target_price: number;
  last_price: number | null;
  previousClose: number | null;
  is_notified: boolean;
  created_at: string;
}

interface WatchlistCardProps {
  watchlist: WatchlistItem[];
  watchlistLoading: boolean;
  deletingId: string | null;
  priceHistories: Record<string, number[]>;
  onDelete: (id: string) => void;
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md animate-pulse">
      <div className="flex justify-between items-start mb-md">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-surface-container-high rounded" />
          <div className="h-4 w-16 bg-surface-container-high rounded" />
        </div>
        <div className="h-8 w-8 bg-surface-container-high rounded-full" />
      </div>
      <div className="h-12 w-full bg-surface-container-high rounded mb-md" />
      <div className="grid grid-cols-2 gap-md pt-2 border-t border-outline-variant">
        <div className="h-8 w-20 bg-surface-container-high rounded" />
        <div className="h-8 w-24 bg-surface-container-high rounded ml-auto" />
      </div>
    </div>
  );
}

export default function WatchlistCard({
  watchlist,
  watchlistLoading,
  deletingId,
  priceHistories,
  onDelete,
}: WatchlistCardProps) {
  return (
    <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-lg border-b border-outline-variant flex justify-between items-center">
        <h2 className="text-title-sm">Active Watchlist</h2>
        <button className="flex items-center gap-xs text-primary font-label-caps hover:underline">
          <span className="material-symbols-outlined text-sm">download</span>
          EXPORT CSV
        </button>
      </div>

      {/* Content */}
      {watchlistLoading ? (
        <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : watchlist.length === 0 ? (
        <div className="p-lg text-center py-xl">
          <span className="material-symbols-outlined text-4xl text-outline mb-md inline-block">
            visibility_off
          </span>
          <p className="text-body-md text-outline">
            No stocks in your watchlist. Search and add one above.
          </p>
        </div>
      ) : (
        <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
          {watchlist.map((item) => {
            const isUp =
              item.previousClose !== null &&
              item.last_price !== null &&
              item.last_price >= item.previousClose;

            const sparkData = (priceHistories[item.id] || []).map(
              (price) => ({ price }),
            );
            const trend =
              sparkData.length >= 2
                ? sparkData[sparkData.length - 1].price >= sparkData[0].price
                  ? "up"
                  : "down"
                : "neutral";

            const statusBadge = item.is_notified
              ? {
                text: "Triggered",
                className:
                  "bg-green-50 text-twse-down border-green-100",
              }
              : {
                text: "Waiting",
                className:
                  "bg-primary-fixed text-primary-fixed-variant border-primary-fixed-dim",
              };

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-md hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-title-sm text-primary">
                      {item.symbol}
                    </span>
                    <span className="text-body-sm text-outline">
                      Target: {formatPrice(item.target_price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-twse-up hover:bg-error-container/30 p-2 rounded-full transition-colors disabled:opacity-50"
                    aria-label={`Remove ${item.symbol}`}
                  >
                    <span className="material-symbols-outlined">
                      {deletingId === item.id ? "hourglass_top" : "delete"}
                    </span>
                  </button>
                </div>

                {/* Sparkline */}
                <div className="h-12 w-full">
                  <StockSparkline
                    data={sparkData}
                    trend={trend}
                  />
                </div>

                {/* Footer */}
                <div className="grid grid-cols-2 gap-md pt-2 border-t border-outline-variant">
                  <div>
                    <p className="text-label-caps text-outline mb-xs">
                      TARGET
                    </p>
                    <p className="text-data-mono">
                      {formatPrice(item.target_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-label-caps text-outline mb-xs">
                      CURRENT
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-label-caps font-semibold rounded-full border ${statusBadge.className}`}
                      >
                        {statusBadge.text}
                      </span>
                      <span
                        className={`text-data-mono ${item.last_price !== null
                          ? isUp
                            ? "text-twse-up"
                            : "text-twse-down"
                          : "text-on-surface"
                          }`}
                      >
                        {formatPrice(item.last_price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
