### US-002：達標時推送 LINE 通知與 check-prices 整合

**作為** 投資看板使用者  
**我想要** 當追蹤項目達到目標價時，在我的 LINE 收到含代號與價格資訊的文字通知  
**以便** 不必開著瀏覽器也能得知達標

**輸入格式**：
- Supabase `watchlist`：`symbol`、`target_price`、`last_price`、`is_notified`、`notified_at`（見主 [`docs/spec.md`](../../spec.md) 第七節資料模型）
- 伺服端查價：沿用 [`lib/yahoo-finance.ts`](../../../lib/yahoo-finance.ts) 的 `fetchStockPrice()`；達標判定與 [`lib/refresh-watchlist-prices.ts`](../../../lib/refresh-watchlist-prices.ts) 內 `tryNotifyTargetReached()` 現有語意一致（`currentPrice >= target_price` 且 `is_notified === false`）
- 整合入口：主要修改 `tryNotifyTargetReached()`（或自 `refreshWatchlistPrices` 抽出的共用模組）；[`app/api/check-prices/route.ts`](../../../app/api/check-prices/route.ts) 維持呼叫 `refreshWatchlistPrices()` 的薄包裝，**勿**在 Route 複製達標邏輯
- **US-001** 已完成：`sendLineText` 與環境變數可用
- **Telegram 與 LINE 並存**：依功能 spec **第九節定案** — env 齊備的管道並行推送，**全部已啟用管道皆成功**後才更新 `is_notified`／`notified_at`

**輸出格式**：
- 達標且 `is_notified === false` 時，依並存策略呼叫 LINE Push（與既有 Telegram 協調）；訊息為繁中可讀文字，至少含：**股票代號**、**目前股價**、**目標股價**、**觸發時間**（對齊主 spec Telegram 範例精神）
- 符合並存策略時才更新 `is_notified = true`、`notified_at`（`last_price`／`updated_at` 仍由 `refreshWatchlistPrices` 既有流程更新）；**任一已啟用管道失敗時不得**標記為已通知
- 文案建構與 LINE HTTP 分層（例如 `lib/stock-notification.ts` vs `lib/line.ts`），避免與 Telegram 邏輯混寫難以維護；錯誤須可追蹤（禁止空 `catch`）

**驗收條件**：
- [ ] 僅當本次 `fetchStockPrice()` 結果 **大於或等於** `target_price` 且 `is_notified === false` 時才呼叫 LINE Push
- [ ] 依 spec 第九節定案：所有已啟用管道成功後 DB 才為「已通知」；任一已啟用管道失敗時 `is_notified`／`notified_at` 不因本次嘗試而被設為已通知
- [ ] 同一筆追蹤在已通知後，再次呼叫檢查 API 不會重複發 LINE
- [ ] 邏輯集中於 `lib/refresh-watchlist-prices.ts`（或共用模組），前端 POST 與日後 Cron GET 共用同一套達標判定與 DB 更新，避免分叉

**依賴關係**：
- **US-001**
- 既有後端：`lib/refresh-watchlist-prices.ts`、`app/api/check-prices`、`lib/yahoo-finance.ts`、Supabase service role、主專案 watchlist 流程（對應 init-project-features **US-005～008／007** 已完成之前提）

**優先級**：P0  
**相關功能**：[`docs/line-push-vercel-cron/spec.md`](../spec.md) Story B、第三節 3.1、第四節、第七節 Story B、第九節並存策略
