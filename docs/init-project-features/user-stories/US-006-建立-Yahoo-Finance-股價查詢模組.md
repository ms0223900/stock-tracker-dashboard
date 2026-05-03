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

#### 驗收說明

**整體結論**：PARTIAL ⚠️

> 型別、解析、`fetchStockPriceServer`／proxy、`fetchStockPrice` 分流與錯誤 throw 均已實作；`fetchStockPrice`（瀏覽器）固定走相對路徑 `/api/yahoo-finance`，與「模組不依賴 Next 路由」字面略有張力但仍符合本專案架構預期。

---

**AC-1：[2330.TW 取得完整股價物件]**

狀態：✅ 通過

- `lib/yahoo-finance.ts`：`StockPrice` 含 `symbol`、`currentPrice`、`high`、`low`、`open`、`volume`、`updatedAt`（及擴充欄位如 `previousClose`、`chartData`）。

---

**AC-2：[無效代號 throw、不回傳部分資料]**

狀態：✅ 通過

- `fetchStockPriceRaw()` 在無 `result`、chart error、無法解析 `currentPrice` 時 `throw`。

---

**AC-3：[回應與 TypeScript 型別一致]**

狀態：✅ 通過

- `YahooChartResponse` 與對 `StockPrice` 的映射集中於同一模組。

---

**AC-4：[模組不依賴 React／Next API、server／client 皆可用]**

狀態：⚠️ 部分實作

- 檔案僅使用標準 `fetch`，無 React import。
- `fetchStockPrice` 之 URL 為硬編碼 `/api/yahoo-finance`，語意倚賴 Next App 的 Route Handler。**差異說明**：複用到非 Next 專案需改為可注入 base URL。

---

**AC-5：[前端經 proxy 避開 CORS]**

狀態：✅ 通過

- `app/api/yahoo-finance/route.ts` GET 代理 Yahoo chart API；`fetchStockPrice(symbol)` 指向該 route。

---

**後續建議**

- 若需完全符合「環境中立」，可將瀏覽器端的 API base path 改為選填參數或環境變數。

**依賴關係**：無
**優先級**：P0
**相關功能**：spec §8 Yahoo Finance、§9 查詢股價流程、CORS 代理
