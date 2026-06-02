# User Stories 依賴關係與技術綜覽

## 依賴圖

```
US-01 即時股價查詢（含必做 OHLC／成交量）
  │
  ▼
US-02 追蹤項目儲存（依賴 US-01 的股價查詢流程）
  │
  ▼
US-03 追蹤清單顯示與輪詢（依賴 US-02 的 watchlist 資料）
  │
  ├──────────────┐
  ▼               ▼
US-04 Telegram    US-05 走勢圖／Sparkline／刪除
通知（與 US-03  │ （spec「最好有」，optional）
  協調寫入       │
  last_price）   │
  │               │
  ▼               ▼
US-06 部署到 Vercel 與整體驗收
（必做：US-01～04；US-05 optional）
```

## Spec §4「必做」與「最好有」對照（User Story 拆法）

以下為 `docs/spec.md` §4 與本資料夾 US 的對應，**驗收 scope 以此為準**，避免將「最好有」誤當成可延後的必做（或相反）。

| spec 條文（摘要） | 必做／最好有 | 主要 US |
|------------------|-------------|---------|
| 完整代號查價、顯示代號／價格／更新時間 | 必做 | US-01 |
| 有資料時顯示今日高／低／開／量（OHLC 網格） | 必做 | **US-01** |
| 儲存目標價、`watchlist`、驗證 | 必做 | US-02 |
| 前端輪詢 60 秒、全量刷新、容錯、卸載停止 | 必做 | US-03 |
| 輪詢／更新流程寫入 `last_price`（spec §7、§9） | 必做 | US-03 + **US-04**（實作上常合併為同一支 API） |
| 達標 Telegram、成功後 `is_notified`／`notified_at`、不重複 | 必做 | US-04 |
| 錯誤訊息可讀、不崩潰 | 必做 | US-01、02、03、04（依情節） |
| 部署 Vercel | 必做 | US-06 |
| 結果卡當日走勢圖、清單 sparkline | **最好有** | **US-05** |
| 刪除追蹤 | **最好有** | **US-05** |
| Vercel Cron 背景檢查 | **最好有**（且定案以輪詢為主） | 未單獨開 US；可日後加 |

### spec §6 與 §4 的差異（說明用）

- §6「畫面至少包含」列有**追蹤區 sparkline**等；§4 將走勢圖、sparkline、刪除列為**最好有**。
- **本專案 User Story 以 §4 為產品範圍准據**：未完成 US-05 仍可視為必做 MVP 驗收通過；若要與設計稿 §6 完全一致，則須完成 **US-05**（或於 spec 修訂中註明例外）。

### 關鍵耦合說明

| 相依關係 | 耦合點 |
|---|---|
| US-02 → US-01 | US-01 建立了 `StockPrice` 型別與 Yahoo Finance 查詢函式，US-02 可直接沿用 |
| US-03 → US-02 | US-02 建立 `watchlist` 資料表與 Supabase client，US-03 讀取同一資料表 |
| US-03 ↔ US-04 | **輪詢觸發**後須完成：`last_price` 寫入 DB（**對每筆成功查價**，含未達標）→ 達標則 Telegram → 成功才標記 `is_notified`。實務上常以**單一 server API** 承接，以避免 client 與 DB 狀態分歧 |
| US-05 → US-03 | US-03 的卡片結構是 US-05 加入 sparkline 與刪除按鈕的基礎 |
| US-05 → US-01 | 走勢圖／sparkline 依賴 US-01 已正規化之 **chartData**；**OHLC 必做顯示**已在 US-01，US-05 可只做樣式對齊設計稿 |
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
| `SUPABASE_SERVICE_ROLE_KEY` | US-04（視 RLS／寫入策略）、US-06 設定 | **否**（僅 server） |
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
    check-prices/route.ts US-04  查價、寫入 last_price、達標 Telegram
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
2. **視覺與清單加值（最好有）**：US-05（不影響核心是否跑通；要對齊設計稿 §6 完整版面時建議做）
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
| 只更新畫面不寫 `last_price` | US-03, US-04 | spec 要求持久化；若 DB 無 `last_price`，比對／通知難以正確或無法驗收 |
| 將 OHLC 必做誤認為 US-05 | US-01, US-05 | spec §4 必做之 OHLC 在 **US-01**；US-05 走勢圖為「最好有」，與 OHLC 網格語意不同（§8） |
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
