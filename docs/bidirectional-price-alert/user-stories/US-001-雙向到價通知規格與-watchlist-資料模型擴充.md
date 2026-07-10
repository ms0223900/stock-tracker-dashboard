### US-001：雙向到價通知規格與 watchlist 資料模型擴充

**作為** 開發者
**我想要** 定義雙向通知的資料欄位、遷移策略與驗收基準
**以便** 前後端有一致契約且舊資料行為不變

**輸入格式**：
- 現有 `watchlist` schema（`supabase/migrations/001_create_watchlist.sql`）與主 [`docs/spec.md`](../../spec.md) 第九節通知流程
- 產品決策：雙向開關、獨立通知狀態、預設值與遷移規則（見 [`../spec.md`](../spec.md)）

**輸出格式**：
- [`docs/bidirectional-price-alert/spec.md`](../spec.md)（功能規格，已定案）
- Supabase migration：新增 `notify_above`、`notify_below`、`is_notified_above`、`is_notified_below`、`notified_at_above`、`notified_at_below`；遷移並移除 `is_notified`、`notified_at`；`CHECK (notify_above OR notify_below)`
- 更新 [`types/watchlist.ts`](../../../types/watchlist.ts) 型別

**驗收條件**：
- [ ] spec 明確定義觸發條件（≥／≤）、至少啟用一方向、預設值與邊界（`price === target` 且雙開時兩方向皆可觸發）
- [ ] migration 對既有列：`notify_above=true`、`notify_below=false`；`is_notified=true` 正確映射至 `is_notified_above` 並複製 `notified_at` → `notified_at_above`
- [ ] 新列 DB default 與應用層預設（above=true、below=false）一致，行為與現有 MVP「僅向上突破」相同
- [ ] `CHECK (notify_above OR notify_below)` 生效，無法插入兩方向皆 false 的列
- [ ] TypeScript `WatchlistItem` 與 DB 欄位一致，已移除 `is_notified`／`notified_at`

**依賴關係**：
- 無（主專案 watchlist 已存在）

**優先級**：P0
**相關功能**：資料模型、主 spec 第九節
