"use client";

import { SparklineChart } from "@/components/SparklineChart";
import { formatPrice, formatUpdateTime } from "@/lib/format";
import type { WatchlistItemDisplay } from "@/types/watchlist";

type WatchlistCardProps = {
  item: WatchlistItemDisplay;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
};

export function WatchlistCard({ item, onDelete, isDeleting = false }: WatchlistCardProps) {
  const showDash = item.priceFetchFailed || item.last_price === null;
  const displayPrice = showDash ? null : item.last_price;
  const showSparkline = !item.priceFetchFailed && (item.chartData?.length ?? 0) > 0;

  return (
    <article className="flex w-full min-w-[280px] max-w-[360px] flex-1 flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-bold text-on-background">{item.symbol}</h3>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-on-background-muted transition-opacity hover:text-on-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            delete
          </span>
          刪除
        </button>
      </div>

      {showSparkline && item.chartData ? (
        <SparklineChart chartData={item.chartData} symbol={item.symbol} />
      ) : !item.priceFetchFailed ? (
        <div
          className="h-14 animate-pulse rounded-[10px] bg-card-muted"
          aria-hidden="true"
        />
      ) : null}

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-on-background-muted">最新價</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-primary">
            {displayPrice === null ? "—" : formatPrice(displayPrice)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-on-background-muted">目標</p>
          <p className="mt-1 text-base font-semibold text-on-background">
            {formatPrice(item.target_price)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-success px-3 py-1 text-[11px] font-semibold text-success-foreground">
          {item.is_notified ? "已達標通知" : "追蹤中"}
        </span>

        {item.is_notified && item.notified_at ? (
          <span className="text-[11px] text-on-background-muted">
            {formatUpdateTime(new Date(item.notified_at))}
          </span>
        ) : null}
      </div>
    </article>
  );
}
