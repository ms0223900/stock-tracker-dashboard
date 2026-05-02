# 折線圖漲跌顯示優化 — AI 開發規格

## 1. 核心 User Story (Core User Stories)

### Story A：折線圖依前一日收盤價顯示漲跌顏色
**As a** 投資者
**I want** 折線圖的線條顏色根據當前股價與前一日收盤價的相對關係，自動顯示紅色（跌）或綠色（漲）
**So that** 我可以一眼辨識今天股價的走勢方向，而不需要自己比對數字。

### Story B：價格漲跌數字與顏色顯示
**As a** 投資者
**I want** 在看盤畫面看到「今日漲跌金額」與「漲跌幅 (%)」，並用紅綠色標示
**So that** 我可以快速了解今天股價的變動幅度。

---

## 2. 功能細節 (Functional Specs)

### For Story A — 折線圖漲跌顏色

#### 2A-1: 擴充 `StockPrice` 資料介面

**檔案：** `lib/yahoo-finance.ts`

在 `StockPrice` interface 中新增欄位：

```typescript
export interface StockPrice {
  symbol: string;
  currentPrice: number;
  previousClose: number;       // 新增：前一日收盤價
  change: number;              // 新增：漲跌金額 = currentPrice - previousClose
  changePercent: number;       // 新增：漲跌幅百分比
  high: number;
  low: number;
  open: number;
  volume: number;
  updatedAt: Date;
  chartData: ChartPoint[];
}
```

#### 2A-2: 從 Yahoo Finance API 提取 `previousClose`

**檔案：** `lib/yahoo-finance.ts` — `fetchStockPriceRaw()` 函數

- 從 Yahoo API 回傳的 `meta` 中讀取 `previousClose` 欄位。
- 計算 `change = regularMarketPrice - previousClose`
- 計算 `changePercent = (change / previousClose) * 100`
- 若 `previousClose` 為 `undefined` 或 `null`（特殊情況如 IPO 首日），則：
  - `previousClose = null`
  - `change = null`
  - `changePercent = null`
  - 漲跌顯示為「—」或中性顏色（灰色/白色）

#### 2A-3: 折線圖動態顏色

**檔案：** `app/page.tsx` — 折線圖 `<Line>` 元件

- 將 `<Line stroke="#10b981">` 改為動態計算：
  - 若 `currentPrice >= previousClose`：使用綠色（如 `#22c55e` 或 `#10b981`）
  - 若 `currentPrice < previousClose`：使用紅色（如 `#ef4444`）
  - 若 `previousClose` 為 `null`：使用中性灰色（如 `#a1a1aa`）

#### 2A-4: 折線圖 Y 軸參考線（選擇性，Nice-to-have）

- 若 `previousClose` 存在，在 chart 中加入一條水平的虛線參考線（`<ReferenceLine>`），標示前一日收盤價的位置。
- 顏色：灰色虛線，標籤顯示 "昨收 $XXX.XX"

### For Story B — 漲跌數字與顏色顯示

#### 2B-1: 主股價區域漲跌顯示

**檔案：** `app/page.tsx` — current price 顯示區域（currently line 285-287）

現狀：
```tsx
<span className="text-3xl font-bold text-emerald-400">
  {formatPrice(stockData.currentPrice)}
</span>
```

改為：
- 顯示股價（大號字體）
- 在股價下方或旁邊顯示：
  - 漲跌金額：`+$X.XX` 或 `-$X.XX`
  - 漲跌幅：`(+X.XX%)` 或 `(-X.XX%)`
- 顏色動態切換：
  - 上漲：綠色（如 `text-emerald-400` 或 `text-green-500`）
  - 下跌：紅色（如 `text-red-400` 或 `text-red-500`）
  - 平盤 / 無資料：灰色（如 `text-zinc-400`）

#### 2B-2: 自選股表格價格顏色

**檔案：** `app/page.tsx` — watchlist table `<td>` 中 `last_price` 顯示

- 目前只是純文字顯示 `formatPrice(item.last_price)`
- 改為：根據該筆資料的價格（若該 ticker 已被查詢且有最新報價），顯示對應漲跌顏色。
- 注意：因 watchlist 僅存 `last_price`，無 `previousClose`，漲跌顏色需在每次 auto-poll 更新時一併取得 `change` / `changePercent`。

#### 2B-3: Auto-poll 更新漲跌資料

**檔案：** `app/page.tsx` — auto-poll `useEffect`

- 每次 auto-poll 呼叫 `fetchStockPrice()` 時，確保回傳完整 `StockPrice`（含 `previousClose`、`change`、`changePercent`）。
- 在 watchlist state 中儲存漲跌資訊，供表格渲染使用。

---

## 3. 驗收標準 (Acceptance Criteria, AC)

### For Story A — 折線圖漲跌顏色

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| A1 | **Happy path — 上漲** | 使用者查詢一檔股票（如 2330.TW），API 回傳 `currentPrice: 150`, `previousClose: 145` | 折線圖渲染完成 | 折線線條為綠色 |
| A2 | **Happy path — 下跌** | 使用者查詢一檔股票，API 回傳 `currentPrice: 140`, `previousClose: 145` | 折線圖渲染完成 | 折線線條為紅色 |
| A3 | **Edge case — 平盤** | `currentPrice === previousClose` | 折線圖渲染完成 | 線條使用中性顏色（灰色或維持綠色） |
| A4 | **Edge case — 無前收盤價** | `previousClose` 為 `null`（新股 IPO 首日） | 折線圖渲染完成 | 線條使用中性灰色，不顯示漲跌標示 |
| A5 | **Regression — 無 chart data** | `chartData.length === 0` | 頁面渲染 | 折線圖不顯示（維持現有隱藏邏輯），不報錯 |

### For Story B — 漲跌數字與顏色顯示

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| B1 | **上漲顯示** | `currentPrice: 150`, `previousClose: 145` | 主價格區域渲染 | 顯示 `$150.00` + `+$5.00 (+3.45%)`，文字為綠色 |
| B2 | **下跌顯示** | `currentPrice: 140`, `previousClose: 145` | 主價格區域渲染 | 顯示 `$140.00` + `-$5.00 (-3.45%)`，文字為紅色 |
| B3 | **無前收盤價** | `previousClose: null` | 主價格區域渲染 | 只顯示 `$140.00`，不顯示漲跌，文字為白色/灰色 |

---

## 4. 技術邊界 (Technical Boundaries)

### 4-1: DB Schema

**無變更。** `previousClose` 是即時行情資料，不需存入資料庫。`watchlist` table 結構不須異動。

### 4-2: API & 資料介面

**無新 API 端點。** 只需要修改現有的：

| 端點 / 模組 | 變更 |
|-------------|------|
| `lib/yahoo-finance.ts` — `StockPrice` interface | 新增 `previousClose`, `change`, `changePercent` 欄位 |
| `lib/yahoo-finance.ts` — `fetchStockPriceRaw()` | 從 Yahoo meta 提取 `previousClose`，計算 `change` / `changePercent` |
| `app/api/yahoo-finance/route.ts` | **無變更** — 代理轉發不回這層改 |
| `app/api/check-prices/route.ts` | **無變更** — 通知邏輯不依賴漲跌顏色 |

### 4-3: 外部服務

| 服務 | 說明 |
|------|------|
| Yahoo Finance API | 回傳的 `meta.previousClose` 已存在，不需額外呼叫。`fetchStockPriceRaw` 只是忽略它。 |

### 4-4: 前端實作範圍

| 檔案 | 變更範圍 |
|------|----------|
| `app/page.tsx` | 3 個區域：chart line stroke color、主價格區域漲跌顯示、watchlist 表格顏色 |
| `lib/yahoo-finance.ts` | `StockPrice` interface + `fetchStockPriceRaw()` 提取邏輯 |

### 4-5: 效能與 SLO

- 所有變更均為前端渲染邏輯，不影響 API 呼叫次數或回應時間。
- 無需新增額外網路請求。

---

## 5. MVP 判定 (MVP vs Later)

| Story | MVP | 說明 |
|-------|-----|------|
| Story A：折線圖漲跌顏色 | **MVP: true** | 這是本次需求的核心 — 讓圖表顏色反映走勢方向 |
| Story B：漲跌數字與顏色顯示 | **MVP: true** | 與 Story A 共用同一資料來源，實作成本極低，且讓使用者能精確知道漲跌幅 |
| 折線圖參考線 (ReferenceLine) 顯示昨收價 | **MVP: false** | 屬於視覺強化，非必要。可放 Nice-to-have |

---

## 6. 資訊缺失與風險 / 注意事項

### 一、開發實作時應注意 (Implementation-time Concerns)

1. **Yahoo Finance API 的 previousClose 可能缺失**：在美股盤前、極早期資料或 IPO 首日，`previousClose` 可能為 `undefined`。`fetchStockPriceRaw()` 必須處理 `null/undefined` 情況，不應讓整個請求失敗。
2. **Auto-poll 的 watchlist 顏色更新**：目前 auto-poll 的 watchlist 更新只寫入 `last_price`（line 92-104）。若要 watchlist 表格也顯示漲跌顏色，auto-poll 也需一併暫存 `previousClose` / `change`，否則無法判斷顏色。
3. **`StockPrice` 型別變更的漣漪效應**：`fetchStockPriceServer()` 也共用 `fetchStockPriceRaw()`，確保 `check-prices/route.ts` 不受 `previousClose` 提取影響（應無副作用，但需確認）。
4. **chart line color 的更新時機**：若資料剛載入時 `currentPrice` 和 `previousClose` 尚未同時就緒，確保預設為中性顏色，避免閃爍（FOUC）。

### 二、規格與需求灰區 (Spec-level Gaps / Pre-dev Questions)

1. **watchlist 表格是否真的需要漲跌顏色？** 使用者需求原文聚焦在「折線圖」，watchlist 的顏色是合理的延伸但未明確要求。建議實作時加入，但若時間緊湊可先做 Story A 與主價格區域。
2. **Taiwan 股市的漲跌停顏色慣例？** 台灣股市紅漲綠跌 vs 歐美綠色漲紅色跌 — 本專案目前使用綠色漲（`text-emerald-400`），與 Yahoo Finance 的 UI 一致，建議維持此慣例。

### 三、動態詢問與邊界調整 (Runtime/Dynamic Clarifications)

1. **若 previousClose 為 0 或極接近 0**：實務上不太可能（股價不會為 0），但除零保護（`changePercent = change / previousClose`）是必要的 runtime safety check。
2. **跨日 chart data 的 baseline**：chart data 是今天的 intraday 資料（`range=1d`），`previousClose` 是昨天的收盤價。兩者在時間尺度上一致，但如果使用者查詢時市場尚未開盤，chart data 可能只有一筆，此時線條顏色仍應正常顯示。
