# User Stories 依賴關係與技術綜覽

## 依賴圖

```
US-01 即時股價查詢
  │
  ▼
US-02 追蹤項目儲存（依賴 US-01 的股價查詢流程）
  │
  ▼
US-03 追蹤清單顯示與輪詢（依賴 US-02 的 watchlist 資料）
  │
  ├──────────────┐
  ▼               ▼
US-04 Telegram    US-05 折線圖與刪除
通知（依賴輪詢）  （依賴清單 UI，optional）
  │               │
  ▼               ▼
US-06 部署到 Vercel 與整體驗收
（依賴 US-01～US-04 核心流程；US-05 optional）
```

### 關鍵耦合說明

| 相依關係 | 耦合點 |
|---|---|
| US-02 → US-01 | US-01 建立了 `StockPrice` 型別與 Yahoo Finance 查詢函式，US-02 可直接沿用 |
| US-03 → US-02 | US-02 建立 `watchlist` 資料表與 Supabase client，US-03 讀取同一資料表 |
| US-04 → US-03 | US-03 的輪詢機制是 US-04 的觸發源；`last_price` 也是 US-03 寫入 |
| US-05 → US-03 | US-03 的卡片結構是 US-05 加入 sparkline 與刪除按鈕的基礎 |
| US-06 → All | 最後一張驗收型 US，依賴前面的完整功能 |

---

## 跨 US 共享技術元件

### 型別定義

| 型別 | 用途 | 首次使用 |
|---|---|---|
| `StockPrice` | Yahoo Finance 正規化結果 | US-01 |
| `WatchlistItem` | 對應 `watchlist` 資料表一列 | US-02 |

建議集中在 `types/stock.ts` 與 `types/watchlist.ts`。

### 環境變數總表

| 變數 | 使用 US | 是否 public |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | US-02, US-03, US-05 | 是 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | US-02, US-03, US-05 | 是 |
| `TELEGRAM_BOT_TOKEN` | US-04 | 否（僅 server） |
| `TELEGRAM_CHAT_ID` | US-04 | 否（僅 server） |

### 預期檔案結構（最終）

```
lib/
  yahoo-finance.ts    US-01   Yahoo Finance API 封裝與正規化
  supabase.ts         US-02   Supabase client 初始化
  telegram.ts         US-04   Telegram API 封裝
types/
  stock.ts            US-01   股價相關型別
  watchlist.ts        US-02   watchlist 相關型別
hooks/
  useWatchlistPolling.ts  US-03  60 秒輪詢 hook
components/
  StockResultCard.tsx US-01   股價結果顯示卡
  WatchlistSection.tsx US-03 追蹤清單區塊（含狀態管理）
  WatchlistCard.tsx   US-03   單張追蹤卡片
  StockChart.tsx      US-05   當日走勢面積圖
  SparklineChart.tsx  US-05   卡片內 sparkline
app/
  page.tsx            US-01   首頁（逐步擴充）
  api/
    check-prices/route.ts US-04  比對股價與觸發通知
    delete-watchlist/route.ts US-05  刪除追蹤項目
```

---

## 各 US 估算工時

| US | 預估新增/修改檔案 | 預估開發時間 |
|---|---|---|
| US-01 | 3-4 檔 | ★★★ 中 |
| US-02 | 3-4 檔 | ★★★ 中 |
| US-03 | 3-4 檔 | ★★★★ 中高（輪詢邏輯需較多邊界處理） |
| US-04 | 2-3 檔 | ★★★ 中 |
| US-05 | 3-4 檔 | ★★★ 中（圖表熟悉度影響大） |
| US-06 | 1 檔 + Vercel 設定 | ★ 低（部署為主） |

---

## MVP 切割彈性

若時間不足，可依以下優先順序調整：

1. **核心流程必做**：US-01 → US-02 → US-03 → US-04 → US-06（完整核心 MVP）
2. **視覺強化選做**：US-05（不影響核心流程是否跑通，但影響展示觀感）
3. **最低可行部署**：US-01 + US-02 + US-03 + US-06（至少展示查詢與儲存、不用通知也能部署驗證）

---

## 常見陷阱提醒

| 陷阱 | 相關 US | 說明 |
|---|---|---|
| API 正規化不全 | US-01 | Yahoo Finance 回傳結構較深，正規化函式需完整處理 null 與邊界 |
| 輪詢資源洩漏 | US-03 | `setInterval` 未在 unmount 清除會造成 ghost request |
| 單筆錯誤拖垮整頁 | US-03 | 輪詢時必須用 `Promise.allSettled`，不可用 `Promise.all` |
| 通知成功前更新 `is_notified` | US-04 | 順序錯誤會造成發送失敗但資料已標記為已通知 |
| 環境變數混入前端 | US-04 | Telegram Token 只能用 server 端 Route Handler，不可前後端共用 |
| 圖表資料語意混淆 | US-05 | 走勢圖 close 極值與 OHLC 網格 high/low 計算方式不同，需分開標示 |

---

## Design Tokens 對照表

以下變數來自 `docs/design.pen`，實作時須轉換為 Tailwind CSS config 或 CSS variables。

### 色彩

| Token | Light | Dark | Tailwind 建議名稱 |
|---|---|---|---|
| `$--background` | `#f3faff` | `#0a1520` | `bg-background` |
| `$--foreground` | `#071e27` | `#e8f4ff` | `text-foreground` |
| `$--muted-foreground` | `#414752` | `#9cb0bd` | `text-muted-foreground` |
| `$--primary` | `#005dac` | `#4da3ff` | `bg-primary` / `text-primary` |
| `$--primary-foreground` | `#ffffff` | `#001c3a` | `text-primary-foreground` |
| `$--secondary` | `#d3e2ed` | `#1a3550` | `bg-secondary` |
| `$--card` | `#ffffff` | `#111f2e` | `bg-card` |
| `$--card-muted` | `#e6f6ff` | `#152535` | `bg-card-muted` |
| `$--border` | `#c1c6d4` | `#3d5a73` | `border-border` |
| `$--color-error` | `#ba1a1a` | `#ffb4ab` | `text-error` / `bg-error` |
| `$--color-success` | `#d4e3ff` | `#004786` | `bg-success` |
| `$--color-success-foreground` | `#001c3a` | `#d4e3ff` | `text-success-foreground` |

### 台股漲跌專用色彩

| Token | 值 | 用途 |
|---|---|---|
| `$--twse-up` | `#eb0000` | 漲 → 紅（台股紅漲綠跌） |
| `$--twse-down` | `#008a3b` | 跌 → 綠 |
| `$--chart-green` | `#1fb86e` | 圖表預設綠（面積圖、極值點） |
| `$--chart-grid` | `light:#d1d5db / dark:#4a5568` | 圖表網格線 |

### 字體

| Token | 值 | 用途 |
|---|---|---|
| `$--font-primary` | Inter | 標題、價格等主要文字，通常 bold/heavy weight |
| `$--font-secondary` | Inter | 內文、標籤等次要文字 |

### 圓角

| Token | 值 | 用途 |
|---|---|---|
| `$--radius-m` | 16px | 卡片、區塊（formCard / resultCard / wlCard） |
| `$--radius-pill` | 999px | 按鈕（queryBtn / saveBtn / pills / 徽章） |

### 佈局參數

| 項目 | 值 | 說明 |
|---|---|---|
| 畫板寬度 | 1920px | 設計圖基準寬度 |
| 內容最大寬度 | 1280px | `content` frame，左右 padding 40px（`contentWrap`） |
| 表單內距 | 28px | `formCard` padding |
| 卡片內距 | 22px | wlCard padding |
| 卡片 gap | 16px | wlGrid gap（水平） |
| 區塊 gap | 16px | content vertical gap |

### 主題機制

設計圖支援 light / dark 雙主題。實作時建議採 CSS variables + `class="dark"` 切換模式（或 `prefers-color-scheme` media query）。設計圖中有 `themeToggle` 元件示意淺色／深色切換按鈕。
