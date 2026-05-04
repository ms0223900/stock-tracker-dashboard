### US-010：解析 Yahoo Finance 回傳的幣別資訊

**作為** 開發者
**我想要** 從 Yahoo Finance API 回傳資料中解析 `currency` 欄位並加入 `StockPrice` 型別
**以便** 後續 UI 與儲存層能根據正確幣別顯示與處理價格

**輸入格式**：
- Yahoo Finance `/v8/finance/chart` API 的 `meta.currency` 欄位（字串，例如 `"TWD"`、`"USD"`、`"HKD"`、`"JPY"`）
- 現有 `StockPrice` 型別定義（`lib/yahoo-finance.ts`）

**輸出格式**：
- `StockPrice` 型別新增 `currency: string` 欄位
- `fetchStockPriceRaw()` 實作解析邏輯，從 `result.meta.currency` 讀取幣別
- 無 `currency` 欄位時預設為 `"TWD"`（向後相容）
- `fetchStockPrice()`、`fetchStockPriceServer()` 自動帶入幣別

**驗收條件**：
- [ ] 查詢 `2330.TW` 時回傳 `currency: "TWD"`
- [ ] 查詢 `AAPL` 時回傳 `currency: "USD"`
- [ ] 查詢 `00700.HK` 時回傳 `currency: "HKD"`（若 Yahoo 有提供）
- [ ] 若 Yahoo 未回傳 `currency` 欄位，預設為 `"TWD"`（不中斷流程）
- [ ] 現有所有引用 `StockPrice` 的程式碼仍可正常編譯

**依賴關係**：
- US-006（既有 Yahoo Finance 模組）

**優先級**：P1
**相關功能**：Yahoo Finance 模組、多幣別支援基礎建設
