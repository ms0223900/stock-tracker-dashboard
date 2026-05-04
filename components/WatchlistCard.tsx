"use client";

import { formatPrice } from "@/lib/format";
import type { ChartPoint } from "@/lib/yahoo-finance";
import type { WatchlistItem } from "@/types/watchlist";
import StockSparkline from "./StockSparkline";

interface WatchlistCardProps {
  watchlist: WatchlistItem[];
  watchlistLoading: boolean;
  deletingId: string | null;
  chartDataMap: Record<string, ChartPoint[]>;
  onDelete: (id: string) => void;
}

function formatNotifiedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-surface-container-high rounded" />
          <div className="h-4 w-16 bg-surface-container-high rounded" />
        </div>
        <div className="h-9 w-20 bg-surface-container-high rounded-full" />
      </div>
      <div className="h-14 w-full bg-surface-container-high rounded-[10px] mb-4" />
      <div className="flex justify-between gap-4 pt-3 border-t border-outline-variant">
        <div className="h-10 w-24 bg-surface-container-high rounded" />
        <div className="h-10 w-28 bg-surface-container-high rounded ml-auto" />
      </div>
    </div>
  );
}

export default function WatchlistCard({
  watchlist,
  watchlistLoading,
  deletingId,
  chartDataMap,
  onDelete,
}: WatchlistCardProps) {
  return (
    <section className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <h2 className="text-xl font-bold text-on-surface">追蹤清單</h2>
        <p className="text-sm text-on-surface-variant">
          每 60 秒更新 · sparkline 與主圖同資料來源
        </p>
      </div>

      {watchlistLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : watchlist.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
          <span
            className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 inline-block"
            aria-hidden
          >
            playlist_add
          </span>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            尚無追蹤項目。查詢股價後可設定目標價並按「儲存追蹤」。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {watchlist.map((item) => {
            const isUp =
              item.previousClose != null &&
              item.last_price !== null &&
              item.last_price >= item.previousClose;

            const sparkData = chartDataMap[item.id] || [];
            const trend =
              sparkData.length >= 2
                ? sparkData[sparkData.length - 1].price >= sparkData[0].price
                  ? "up"
                  : "down"
                : "neutral";

            const notifiedLabel = formatNotifiedAt(item.notified_at);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-[22px] flex flex-col gap-3.5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-[17px] font-bold text-on-surface tabular-nums">
                    {item.symbol}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`刪除 ${item.symbol}`}
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden>
                      {deletingId === item.id ? "hourglass_top" : "delete"}
                    </span>
                    刪除
                  </button>
                </div>

                <div className="flex justify-between items-end gap-4">
                  <div>
                    <p className="text-xs text-on-surface-variant mb-0.5">最新價</p>
                    <p
                      className={`text-[22px] font-bold tabular-nums ${item.last_price !== null
                        ? isUp
                          ? "text-twse-up"
                          : "text-twse-down"
                        : "text-primary"
                        }`}
                    >
                      {formatPrice(item.last_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant mb-0.5">目標</p>
                    <p className="text-base font-semibold text-on-surface tabular-nums">
                      {formatPrice(item.target_price)}
                    </p>
                  </div>
                </div>

                <StockSparkline data={sparkData} trend={trend} />

                <div className="flex flex-wrap items-center gap-2">
                  {item.is_notified ? (
                    <>
                      <span className="inline-flex items-center rounded-full bg-success px-2.5 py-1.5 text-[11px] font-semibold text-success-foreground">
                        已達標通知
                      </span>
                      {notifiedLabel ? (
                        <span className="text-[11px] text-on-surface-variant">
                          {notifiedLabel}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-success px-2.5 py-1.5 text-[11px] font-semibold text-success-foreground">
                      追蹤中
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
