### US-002：建立 Yahoo Finance 股價查詢模組

**作為** 開發者
**我想要** 一個可重複使用的 Yahoo Finance API 查詢模組
**以便** 前端與背景工作都能取得即時股價資料

**輸入格式**：
- 股票代號字串，例如 `2330.TW`
- API endpoint：`https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

**輸出格式**：
- TypeScript 型別定義（`StockPrice`：symbol, currentPrice, high, low, open, volume, updatedAt）
- `lib/yahoo-finance.ts` 模組，export `fetchStockPrice(symbol: string): Promise<StockPrice>`
- API 失敗時 throw 明確的 error（可被呼叫端 catch 並顯示錯誤訊息）

**驗收條件**：
- [ ] 傳入 `2330.TW` 可成功取得股價物件，包含 symbol、currentPrice、high、low、open、volume、updatedAt
- [ ] 傳入無效代號時 throw error，不回傳部分資料
- [ ] API 回應格式與 TypeScript 型別一致
- [ ] 模組不依賴 React/Next.js 特定 API，可在 server 端與 client 端使用

**依賴關係**：無
**優先級**：P0
**相關功能**：spec §8 Yahoo Finance、§9 查詢股價流程
