/** Supabase `watchlist` row shape used by client UI */
export interface WatchlistItem {
  id: string;
  symbol: string;
  target_price: number;
  last_price: number | null;
  previousClose: number | null;
  is_notified: boolean;
  /** 通知成功時間（DB 有欄位時由 select * 帶回） */
  notified_at?: string | null;
  created_at: string;
}
