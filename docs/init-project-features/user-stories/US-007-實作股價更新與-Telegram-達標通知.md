### US-007：實作股價更新與 Telegram 達標通知

**作為** 使用者
**我想要** 系統自動比對目前股價與目標股價，並在達標時透過 Telegram 通知我
**以便** 我不需要手動盯盤就能知道何時達到目標價

**輸入格式**：
- watchlist 中的所有追蹤項目
- 每筆對應的即時股價
- 環境變數：`TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`

**輸出格式**：
- `last_price` 欄位更新為最新股價
- 當 `last_price >= target_price` 且 `is_notified = false` 時：
  - 發送 Telegram 訊息（含股票代號、目前股價、目標股價、觸發時間）
  - 成功後更新 `is_notified = true`、`notified_at = 目前時間`
  - 已通知項目不重複發送
- Telegram 發送失敗時不標記為已通知

**驗收條件**：
- [ ] 目前股價低於目標股價時，不發送 Telegram，`is_notified` 維持 `false`
- [ ] 目前股價大於或等於目標股價時，Telegram 收到通知
- [ ] 通知內容包含股票代號、目前股價、目標股價與觸發時間
- [ ] 同一筆追蹤資料已通知後不會再次發送
- [ ] Telegram API 失敗時 `is_notified` 不變成 `true`
- [ ] `last_price` 每次檢查後正確更新

**依賴關係**：US-005（Supabase）、US-006（Yahoo Finance 模組）、US-008（追蹤清單存在）
**優先級**：P0
**相關功能**：spec §4 必做、§8 Telegram、§9 更新與通知流程
