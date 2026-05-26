export const SYMBOL_FORMAT_ERROR =
  "請輸入完整股票代號，例如 2330.TW";

export const TARGET_PRICE_ERROR = "請輸入大於 0 的目標股價";

export const STOCK_FETCH_ERROR = "目前無法取得股價資料，請稍後再試";

export const WATCHLIST_SAVE_SUCCESS = "已加入追蹤清單";

export const WATCHLIST_SAVE_ERROR = "無法儲存追蹤項目，請稍後再試";

export const WATCHLIST_FETCH_ERROR = "無法載入追蹤清單，請稍後再試";

export const NOTIFICATION_SEND_ERROR =
  "達標通知發送失敗，請稍後再試或檢查設定";

export const WATCHLIST_EMPTY_MESSAGE = "尚未加入任何追蹤項目";

export const WATCHLIST_DELETE_ERROR = "無法刪除追蹤項目，請稍後再試";

export const WATCHLIST_DELETE_CONFIRM = "確定要刪除此追蹤項目？";

/** spec §4：前端輪詢固定 60 秒 */
export const POLL_INTERVAL_MS = 60_000;
