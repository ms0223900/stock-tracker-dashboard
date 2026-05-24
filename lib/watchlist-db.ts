import type { WatchlistItem } from "@/types/watchlist";

type WatchlistRow = {
  id: string;
  symbol: string;
  target_price: number | string;
  last_price: number | string | null;
  is_notified: boolean;
  notified_at: string | null;
  created_at: string;
  updated_at: string | null;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeWatchlistRow(row: WatchlistRow): WatchlistItem {
  const targetPrice = toNumber(row.target_price);

  return {
    id: row.id,
    symbol: row.symbol,
    target_price: targetPrice ?? 0,
    last_price: toNumber(row.last_price),
    is_notified: row.is_notified,
    notified_at: row.notified_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
