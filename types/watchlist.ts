import type { ChartDataPoint } from "@/types/stock";

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

/** 輪詢刷新後供 UI 使用的清單列（含單筆查價失敗標記） */
export type WatchlistItemDisplay = WatchlistItem & {
  priceFetchFailed?: boolean;
  chartData?: ChartDataPoint[];
};
