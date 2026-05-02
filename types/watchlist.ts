/** Supabase `watchlist` row shape used by client UI */
export interface WatchlistItem {
  id: string;
  symbol: string;
  target_price: number;
  last_price: number | null;
  previousClose: number | null;
  is_notified: boolean;
  created_at: string;
}
