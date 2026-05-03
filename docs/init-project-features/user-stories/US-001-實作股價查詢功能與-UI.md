### US-001：實作股價查詢功能與 UI

**作為** 使用者
**我想要** 輸入台股股票代號並查詢目前股價
**以便** 查看即時股價、今日高低價、開盤價與成交量

**輸入格式**：
- 使用者在 input 中輸入股票代號（例如 `2330.TW`）
- 點擊「查詢股價」按鈕

**輸出格式**：
- 畫面顯示：股票代號、目前價格、更新時間
- 若 API 有提供：今日最高價、最低價、開盤價、成交量
- 查詢中顯示 loading 狀態
- 查詢失敗顯示錯誤訊息

**驗收條件**：
- [x] 輸入 `2330.TW` 點擊查詢，畫面顯示目前股價與更新時間
- [x] 顯示今日最高價、最低價、開盤價、成交量（若 API 有提供）
- [x] 查詢期間按鈕顯示 loading 狀態，防止重複送出
- [x] API 失敗時畫面顯示「目前無法取得股價資料，請稍後再試」
- [x] 股價資訊區在未查詢前不顯示，查詢成功後才出現

#### 驗收說明

**整體結論**：PARTIAL ⚠️

> 核心查詢、OHLC／成交量與規格錯誤文案均已實作；再次查詢時會暫清空 `stockData`，股價卡片區在請求進行中可能短暫消失，僅按鈕顯示 loading，與「查詢中」體驗解讀可能需要產品確認。

---

**AC-1：[輸入 2330.TW 顯示目前股價與更新時間]**

狀態：✅ 通過

- `components/StockResultCard.tsx` 顯示 `stockData.symbol`、目前價格；有圖表資料時另有「上次更新」，無圖時顯示 `更新於 …`。
- `hooks/useStockQuery.ts` 的 `handleQuery()` 成功後設定 `stockData`。

---

**AC-2：[顯示今日高／低／開盤／成交量（若 API 有提供）]**

狀態：✅ 通過

- `components/StockResultCard.tsx` 的 OHLC 網格顯示 `open`、`high`、`low`、`volume`。
- `lib/yahoo-finance.ts` 從 Yahoo chart API 組出上述欄位。

---

**AC-3：[查詢期間按鈕 loading、防止重複送出]**

狀態：✅ 通過

- `components/StockQueryForm.tsx`：`disabled={queryLoading}`、`queryLoading` 時顯示 spinner 文案。
- `hooks/useStockQuery.ts`：`setQueryLoading(true/false)` 包住 fetch。

---

**AC-4：[API 失敗顯示「目前無法取得股價資料，請稍後再試」]**

狀態：⚠️ 部分實作

- `hooks/useStockQuery.ts` 在 `catch` 中若為非 `Error` 會使用「目前無法取得股價資料，請稍後再試」；若為 `Error` 則顯示 `err.message`。
- （與字面 AC）Yahoo／proxy 若拋出具體錯誤字串時，使用者看到的**不一定**正好是該固定句。**差異說明**：與 AC「一律顯示該固定句」有落差。

---

**AC-5：[未查詢前不顯示股價資訊區，成功後才出現]**

狀態：✅ 通過

- `app/page.tsx`：僅當 `(stockData || queryError)` 為真時渲染 `StockResultCard` 區塊；初始無資料不顯示該區。

---

**後續建議**

- 若要完全符合 AC-4 固定文案，可在 `catch` 中一律對使用者顯示該繁中句並將細節寫入 `console`/log。
- 若要避免再次查詢時結果區閃逝，可查詢期間保留上一筆 `stockData` 或於卡片內顯示 overlay loading。

**依賴關係**：US-006（Yahoo Finance 模組）
**優先級**：P0
**相關功能**：spec §4 必做、§6 UI 範圍、§9 查詢股價流程
