### US-006：建立 Yahoo Finance 股價查詢模組

**作為** 開發者
**我想要** 一個可重複使用的 Yahoo Finance API 查詢模組
**以便** 前端與背景工作都能取得即時股價資料

**輸入格式**：
- 股票代號字串，例如 `2330.TW`
- API endpoint：`https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

**輸出格式**：
- TypeScript 型別定義（`StockPrice`：symbol, currentPrice, high, low, open, volume, updatedAt, chartData）
- `lib/yahoo-finance.ts` 模組，export 兩個函式：
  - `fetchStockPrice(symbol)`：**前端用**，透過 `/api/yahoo-finance` proxy 繞過 CORS 限制
  - `fetchStockPriceServer(symbol)`：**Server 端用**，直接呼叫 Yahoo Finance API
- API 失敗時 throw 明確的 error（可被呼叫端 catch 並顯示錯誤訊息）
- `app/api/yahoo-finance/route.ts`：代理 Yahoo Finance 請求，解決瀏覽器 CORS 問題

**驗收條件**：
- [x] 傳入 `2330.TW` 可成功取得股價物件，包含 symbol、currentPrice、high、low、open、volume、updatedAt
- [x] 傳入無效代號時 throw error，不回傳部分資料
- [x] API 回應格式與 TypeScript 型別一致
- [x] 模組不依賴 React/Next.js 特定 API，可在 server 端與 client 端使用
- [x] 前端透過 proxy API route 呼叫，不受 CORS 阻擋

**依賴關係**：無
**優先級**：P0
**相關功能**：spec §8 Yahoo Finance、§9 查詢股價流程、CORS 代理
