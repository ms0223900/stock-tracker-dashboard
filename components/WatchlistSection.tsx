import { ErrorBanner } from "@/components/ErrorBanner";
import { WatchlistCard } from "@/components/WatchlistCard";
import { WATCHLIST_EMPTY_MESSAGE } from "@/lib/constants";
import type { WatchlistItemDisplay } from "@/types/watchlist";

type WatchlistSectionProps = {
  items: WatchlistItemDisplay[];
  isLoading: boolean;
  errorMessage: string | null;
  onDelete: (id: string) => void;
  deletingId?: string | null;
};

function WatchlistSkeleton() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="h-[220px] animate-pulse rounded-2xl border border-border bg-card-muted"
        />
      ))}
    </>
  );
}

export function WatchlistSection({
  items,
  isLoading,
  errorMessage,
  onDelete,
  deletingId = null,
}: WatchlistSectionProps) {
  const showEmpty = !isLoading && !errorMessage && items.length === 0;
  const showGrid = !isLoading && !errorMessage && items.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-on-background">追蹤清單</h2>
        <p className="mt-1 text-sm text-on-background-muted">每 60 秒更新</p>
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <div className="flex flex-wrap gap-4">
        {isLoading ? <WatchlistSkeleton /> : null}

        {showEmpty ? (
          <p className="w-full py-10 text-center text-sm text-on-background-muted">
            {WATCHLIST_EMPTY_MESSAGE}
          </p>
        ) : null}

        {showGrid
          ? items.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onDelete={onDelete}
                isDeleting={deletingId === item.id}
              />
            ))
          : null}
      </div>
    </section>
  );
}
