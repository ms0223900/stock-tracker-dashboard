import { formatPrice, formatUpdateTime } from "@/lib/format";
import type { WatchlistItemDisplay } from "@/types/watchlist";

type WatchlistCardProps = {
  item: WatchlistItemDisplay;
};

export function WatchlistCard({ item }: WatchlistCardProps) {
  const showDash = item.priceFetchFailed || item.last_price === null;
  const displayPrice = showDash ? null : item.last_price;

  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[17px] font-bold text-on-background">{item.symbol}</h3>
      </div>

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
