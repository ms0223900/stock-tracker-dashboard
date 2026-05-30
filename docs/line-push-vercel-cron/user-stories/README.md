# LINE Push 與 Vercel Cron — User Stories 一覽

本目錄對應 [`../spec.md`](../spec.md) 之加分功能：先獨立驗證 LINE，再串達標推送，最後接上 Vercel Cron。

---

## US 一覽表

| US | 標題 | 優先級 | 依賴 | 簡要說明 |
| --- | --- | --- | --- | --- |
| **001** | 獨立驗證 LINE Push 與測試 Route | P0 | — | `lib/line`、`POST /api/test-line`、環境變數，不經股價／DB |
| **002** | 達標時推送 LINE 通知與 check-prices 整合 | P0 | US-001 | 在 `lib/refresh-watchlist-prices.ts` 整合 LINE、並存策略、成功才更新 `is_notified` |
| **003** | Vercel Cron 與排程端點驗證 | P1 | US-002 | `crons`、`CRON_SECRET`、GET 相容、Production 驗證 |

---

## 依賴關係圖

```
US-001（LINE 底層 + 測試 Route）
    │
    ▼
US-002（達標 LINE + refresh-watchlist-prices 整合）
    │
    ▼
US-003（Vercel Cron + secret + GET）
```

（隱含前提：主專案已完成 Supabase watchlist、Yahoo 查價、`/api/check-prices` 既有流程 — 見 `docs/init-project-features/user-stories`。）

---

## 依賴說明

- **US-001** 無程式內前置 US；需自行完成 LINE Developers channel 與本機／Vercel 環境變數。
- **US-002** 必須在 US-001 完成後實作，否則無法發送 LINE；並依賴 `lib/refresh-watchlist-prices.ts`、Yahoo 查價與 `watchlist`。
- **US-003** 必須在 US-002 完成後實作，確保定時觸發走的是已驗證之檢查與通知邏輯。

---

## 建議開發順序

| Wave | 內容 | 可否平行 |
| --- | --- | --- |
| **Wave 1** | US-001 | 單線進行 |
| **Wave 2** | US-002 | 須待 Wave 1 |
| **Wave 3** | US-003 | 須待 Wave 2 |

US-002 須依功能 spec **第九節「Telegram 與 LINE 並存策略」定案**實作（env 齊備管道並行、全部成功才標記 `is_notified`）。
