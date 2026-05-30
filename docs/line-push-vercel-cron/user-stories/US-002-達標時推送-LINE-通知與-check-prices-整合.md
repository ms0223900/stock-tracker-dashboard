### US-002：達標時推送 LINE 通知與 check-prices 整合

**作為** 投資看板使用者  
**我想要** 當追蹤項目達到目標價時，在我的 LINE 收到含代號與價格資訊的文字通知  
**以便** 不必開著瀏覽器也能得知達標

**輸入格式**：
- Supabase `watchlist`：`symbol`、`target_price`、`last_price`、`is_notified`、`notified_at`（見主 [`docs/spec.md`](../../spec.md) 第七節資料模型）
- 伺服端查價：沿用既有 Yahoo／`fetchStockPriceServer`（或同等）取得本次價格；達標判定與既有 [`app/api/check-prices/route.ts`](../../../app/api/check-prices/route.ts) 語意對齊（含 `isAmbiguousPrevCloseSnapshot` 等既有規則時須一致）
- **US-001** 已完成：`sendLineText` 與環境變數可用
- **待產品決策**：達標時是否與 Telegram **並行**推送，或依環境變數僅啟用單一管道（見功能 spec 第四節「與現有程式對齊」、第九節風險表）；實作 PR 須載明決策

**輸出格式**：
- 達標且 `is_notified === false` 時呼叫 LINE Push；訊息為繁中可讀文字，至少含：**股票代號**、**目前股價**、**目標股價**、**觸發時間**（對齊主 spec Telegram 範例精神）
- LINE API **成功後**才更新 `is_notified = true`、`notified_at`（並可比照現有流程更新 `last_price`／`updated_at`）；**失敗時不得**標記為已通知
- 文案建構與 LINE HTTP 分層（例如通知建構函式 vs `lib/line.ts`），避免與 Telegram 邏輯混寫難以維護；錯誤須可追蹤（禁止空 `catch`）

**驗收條件**：
- [ ] 僅當本次判定之價格 **大於或等於** `target_price` 且 `is_notified === false` 時才呼叫 LINE Push
- [ ] LINE 成功後 DB 狀態符合「已通知」；失敗時 `is_notified`／`notified_at` 不因本次嘗試而被設為已通知
- [ ] 同一筆追蹤在已通知後，再次呼叫檢查 API 不會重複發 LINE
- [ ] 與既有 `/api/check-prices` 流程共用同一套達標判定與 DB 更新語意，或抽出共用模組後兩路一致（避免分叉邏輯）

**依賴關係**：
- **US-001**
- 既有後端：`app/api/check-prices`、`lib/yahoo-finance`、Supabase service role、主專案 watchlist 流程（對應 init-project-features **US-005～008／007** 已完成之前提）

**優先級**：P0  
**相關功能**：[`docs/line-push-vercel-cron/spec.md`](../spec.md) Story B、第三節 3.1、第四節、第七節 Story B
