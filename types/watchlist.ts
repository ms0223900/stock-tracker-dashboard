export type WatchlistItem = {
  id: string;
  symbol: string;
  target_price: number;
  last_price: number | null;
  is_notified: boolean;
  notified_at: string | null;
  created_at: string;
  updated_at: string | null;
};
