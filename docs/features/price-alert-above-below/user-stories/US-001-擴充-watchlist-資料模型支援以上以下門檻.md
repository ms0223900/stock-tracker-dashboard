### US-001：擴充 watchlist 資料模型支援以上／以下門檻

**作為** 開發者
**我想要** 在 Supabase `watchlist` 支援可選的「以上」與「以下」目標價，以及各自的通知狀態欄位
**以便** 同一筆追蹤能分別設定雙向門檻且獨立記錄是否已通知

**輸入格式**：
- 既有 `watchlist` 表與 migration
- 既有列的 `target_price`／`is_notified`／`notified_at`

**輸出格式**：
- 新 migration：`target_price` 改為可空（語意為以上門檻）；新增 `target_price_below`、`is_below_notified`、`notified_at_below`
- 既有資料遷移完成（原 `target_price` 維持為以上門檻）
- TypeScript `WatchlistItem` 與價格檢查 row 型別更新

**驗收條件**：
- [ ] 新 migration 可套用且不破壞既有列
- [ ] 既有列的 `target_price` 仍為原值，並可作為「以上」門檻；既有 `is_notified`／`notified_at` 語意對應「以上」
- [ ] 可寫入僅以上、僅以下、或兩者皆有的列
- [ ] DB CHECK 拒絕兩個門檻皆空的列
- [ ] DB CHECK 拒絕兩者皆設且 `target_price <= target_price_below` 的列
- [ ] 各非空門檻在 DB 層須 > 0（CHECK）
- [ ] `types/watchlist.ts` 與 `runWatchlistPriceCheck` 使用的 row 型別反映新欄位（含可 null 的 `target_price`）
- [ ] 清單讀取與價格檢查的 select／映射會帶出 `target_price_below`、`is_below_notified`、`notified_at_below`

**依賴關係**：
- 無

**優先級**：P0
**相關功能**：資料模型／[`../spec.md`](../spec.md) §2／主 spec §7
