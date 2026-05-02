### US-013：重新設計目標價格設定與 Telegram 資訊卡

**作為** 使用者
**我想要** 目標價格設定表單改為獨立卡片，並看到 Telegram 串接狀態
**以便** 在查詢股價時能直覺設定追蹤價格並了解通知管道狀態

**輸入格式**：
- 現有 `page.tsx` 的 `targetPrice`、`targetPriceError`、`handleSave`、`saving`、`saveError` 狀態與邏輯（功能不變）
- 設計樣本 `code.html` 的「Set Target Price」表單卡片與「Telegram Integration」資訊卡
- 12 欄 grid 系統（右側 4 欄空間 `lg:col-span-4`）

**輸出格式**：
- **Set Target Price 卡片**（`lg:col-span-4` 上半部）：
  - 標題「Set Target Price」含 alert icon
  - `TRIGGER PRICE (TWD)` label + 數字輸入框
  - `CONDITION` label + 下拉選單（Price is Above / Price is Below）
  - Save Alert 按鈕（primary 藍色，滿寬）
  - 驗證錯誤訊息保留，樣式更新
- **Telegram Integration 卡片**（`lg:col-span-4` 下半部）：
  - Telegram 傳送圖示（圓形白色半透明背景）
  - 標題「Telegram Alerts Active」
  - 說明文字「Connect @ZenTradeTW_Bot to receive instant market notifications...」
  - VIEW SETTINGS 按鈕（白色 outline 風格）
  - 背景使用 `primary-container`（深藍色），文字白色

**驗收條件**：
- [ ] Set Target Price 卡片標題顯示「Set Target Price」與 alert icon
- [ ] TRIGGER PRICE 輸入框 accept 數字，placeholder 提示輸入目標價
- [ ] CONDITION 下拉選單提供「Price is Above」與「Price is Below」兩選項
- [ ] Save Alert 按鈕為 primary 藍色滿寬
- [ ] 儲存中有「儲存中...」狀態
- [ ] 驗證錯誤以紅色文字顯示
- [ ] 儲存成功後自動刷新 watchlist
- [ ] Telegram 卡片顯示在目標價格卡片下方
- [ ] Telegram 卡片背景為 primary blue 深色，文字白色
- [ ] Telegram 卡片含圖示、標題、說明文字、VIEW SETTINGS 按鈕
- [ ] 右側兩個卡片在 lg 以上垂直排列，行動版滿寬
- [ ] 既有儲存邏輯與 Supabase 串接完全保留

**依賴關係**：
- US-010（設計系統主題）
- US-011（版面結構與 grid 系統）
- US-012（需有 stockData 才能設定目標價）

**優先級**：P0
**相關功能**：目標價格與通知設定
