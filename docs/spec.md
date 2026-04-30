# 股價投資看板 Spec

## 1. 背景與目標

本專案是課程用 MVP，目標是讓使用者輸入台股股票代號與目標股價，系統取得即時股價、儲存追蹤條件，並在股價達標時透過 Telegram 發送通知。第一版重點是做出可操作、可部署、可驗收的最小產品，不是完整投資分析平台。

## 2. 來源文件摘要

- GTD 任務文件：主功能為「即時股價投資看板 + Telegram 提醒」。技術選型已決定為 Next.js App Router、Tailwind CSS、Recharts、Yahoo Finance 非官方 API、Supabase、Telegram Bot API、Vercel；MVP 先做能跑的最小版本，進階項目包含 Vercel Cron 與歷史股價儲存。
- 精簡版需求文件：第一版一定要完成查股價、輸入目標價、達標通知、Vercel 部署；最好有折線圖與每 60 秒自動更新；先不做登入、多股票清單管理、歷史股價、LINE、技術分析與付費功能。
- 流程與驗收文件：補充 `watchlist` 資料表、輸入驗證、查詢股價、儲存追蹤、更新與比對目標價、Telegram 通知、避免重複通知，以及可操作的驗收條件。

## 3. 技術棧

- Framework：Next.js App Router
- Language：TypeScript
- Styling：Tailwind CSS
- Chart：Recharts
- Database：Supabase PostgreSQL
- Stock API：Yahoo Finance chart API
- Notification：Telegram Bot API
- Deploy：Vercel

## 4. MVP 功能範圍

### 必做

- 使用者可輸入完整台股股票代號，例如 `2330.TW`。
- 使用者可查詢目前股價，畫面顯示股票代號、目前價格與更新時間。
- 若 API 提供資料，顯示今日最高價、最低價、開盤價與成交量。
- 使用者可輸入大於 0 的目標股價並儲存追蹤項目。
- 追蹤項目儲存在 Supabase `watchlist` 表。
- 系統可比較目前股價與目標股價。
- 當目前股價大於或等於目標股價，且尚未通知時，發送 Telegram 通知。
- 通知成功後標記 `is_notified = true` 並記錄 `notified_at`。
- 查詢、驗證、資料庫與通知失敗時，畫面顯示可理解的錯誤訊息。
- 專案可部署到 Vercel 並透過公開網址使用。

### 最好有

- 當日股價走勢折線圖。
- 前端每 60 秒自動重新取得股價。
- 基本刪除追蹤項目。
- Next.js API route 搭配 Vercel Cron 做背景自動檢查。

### 先不做

- 使用者登入與多使用者隔離。
- 多支股票清單的完整管理體驗。
- 股票中文名稱搜尋或自動補 `.TW`。
- 歷史股價資料儲存。
- 技術分析、買賣建議、投資組合損益。
- LINE Messaging API 整合。
- 付費訂閱、後台管理與交易功能。

## 5. 使用者輸入

### 股票代號

- 格式：台股代號加 `.TW`，例如 `2330.TW`、`2317.TW`、`2454.TW`。
- 第一版不支援中文股票名稱。
- 第一版不自動補 `.TW`。
- 空值、`2330`、`台積電` 等格式需顯示錯誤。

### 目標股價

- 必須是大於 0 的數字。
- 可接受整數或小數，例如 `2200`、`780.5`。
- 空值、文字、`0`、負數不可儲存。

## 6. UI 範圍

第一版畫面至少包含：

- 股票代號輸入框。
- 目標股價輸入框。
- 查詢股價按鈕。
- 儲存追蹤按鈕。
- 股價結果區。
- 追蹤清單區。
- 錯誤訊息區。

畫面只需清楚、可操作、不混亂；美觀不是第一版完成標準。

## 7. 資料模型

### `watchlist`

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `id` | UUID | 是 | 每筆追蹤資料的唯一 ID |
| `symbol` | text | 是 | 股票代號，例如 `2330.TW` |
| `target_price` | numeric | 是 | 使用者設定的目標股價 |
| `last_price` | numeric | 否 | 最近一次查到的股價 |
| `is_notified` | boolean | 是 | 是否已發送達標通知，預設 `false` |
| `notified_at` | timestamptz | 否 | 通知成功時間 |
| `created_at` | timestamptz | 是 | 建立時間 |
| `updated_at` | timestamptz | 否 | 最後更新時間 |

## 8. API 與服務設計

### Yahoo Finance

- Endpoint：`https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`
- Demo 可使用 `2330.TW`。
- 需要將 API response 正規化為應用程式內部型別，至少包含 symbol、current price、update time、high、low、open、volume。
- API 失敗時顯示「目前無法取得股價資料，請稍後再試」。

### Supabase

- 用於儲存追蹤項目與通知狀態。
- 新增追蹤項目時，`is_notified` 預設為 `false`。
- 每次取得股價後可更新 `last_price`。
- 通知成功後更新 `is_notified` 與 `notified_at`。

### Telegram

- 使用 Telegram Bot API。
- 必要環境變數：`TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`。
- 通知內容至少包含股票代號、目前股價、目標股價與觸發時間。
- 發送失敗時不可把 `is_notified` 標記為 `true`。

通知範例：

```text
股價達標提醒
股票：2330.TW
目前股價：2205
目標股價：2200
時間：2026-04-29 14:30
```

## 9. 核心流程

### 查詢股價

1. 使用者輸入股票代號。
2. 系統驗證格式。
3. 格式正確時呼叫 Yahoo Finance。
4. 成功時顯示股價資訊。
5. 失敗時顯示錯誤訊息。

### 儲存追蹤

1. 使用者輸入股票代號與目標股價。
2. 系統驗證兩個欄位。
3. 格式正確時寫入 Supabase。
4. 畫面更新追蹤清單。
5. 儲存失敗時顯示錯誤訊息。

### 更新與通知

1. 系統讀取追蹤項目。
2. 系統取得每筆股票目前股價。
3. 更新 `last_price`。
4. 若 `last_price >= target_price` 且 `is_notified = false`，發送 Telegram。
5. 通知成功後更新 `is_notified` 與 `notified_at`。
6. 已通知項目不重複通知。

## 10. 環境變數

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（如需 server-side 管理操作，僅 server 使用）
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

敏感資訊不得提交到版本控制。

## 11. 驗收條件

- 輸入 `2330.TW` 並查詢後，畫面顯示目前股價與更新時間。
- 輸入 `台積電`、`2330` 或空白時，畫面提示「請輸入完整股票代號，例如 2330.TW」。
- 目標股價為空白、`abc`、`0` 或負數時，畫面提示「請輸入大於 0 的目標股價」且不寫入資料庫。
- 輸入 `2330.TW` 與 `2200` 後按下儲存，Supabase `watchlist` 新增資料，刷新後仍可看到追蹤項目。
- 當目前股價低於目標股價，不發送 Telegram，`is_notified` 維持 `false`。
- 當目前股價大於或等於目標股價，Telegram 收到通知，內容包含股票代號、目前股價與目標股價。
- 同一筆追蹤資料已通知後，不會在下次更新時重複發送。
- 股價 API、Supabase 或 Telegram 發生錯誤時，畫面顯示清楚提示且不讓應用程式崩潰。
- 部署到 Vercel 後，仍可查詢股價、新增追蹤項目、讀取資料並觸發通知。

## 12. 未決問題

- 第一版是否一定要包含 Recharts 折線圖，或列為課程加分項目即可？
- 背景自動檢查是否要在 MVP 交付時完成，或先以每 60 秒前端輪詢示範？
- Supabase Row Level Security 策略是否要配合未來登入預先設計，或先採單使用者 Demo 設定？
- Telegram Chat ID 是固定給課程 demo 使用，還是要讓使用者自行輸入？
