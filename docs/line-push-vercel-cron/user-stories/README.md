# LINE Push 與 Vercel Cron — User Stories 一覽

本目錄對應 [`../spec.md`](../spec.md) 之加分功能：先獨立驗證 LINE，再串達標推送，最後接上 Vercel Cron。

---

## US 一覽表

| US | 標題 | 優先級 | 依賴 | 簡要說明 |
| --- | --- | --- | --- | --- |
| **001** | 獨立驗證 LINE Push 與測試 Route | P0 | — | `lib/line`、`POST /api/test-line`、環境變數，不經股價／DB |
| **002** | 達標時推送 LINE 通知與 check-prices 整合 | P0 | US-001 | 達標文案、與既有檢查 API 共用語意、成功才更新 `is_notified` |
| **003** | Vercel Cron 與排程端點驗證 | P1 | US-002 | `vercel.json`、`GET /api/cron/check-prices`、`CRON_SECRET`；**Hobby 限每日一次 Cron**（過頻則 deploy 失敗） |

---

## Vercel Hobby 與 Cron（重要）

官方說明：**Hobby 帳號的 Cron 限每天執行一次**；若 `schedule` 比每日一次更頻繁，**部署會失敗**（`Cron expressions that would run more frequently will fail during deployment`）。細節與英文原文見主 [`docs/spec.md`](../../spec.md) 第十節。

## 依賴關係圖

```
US-001（LINE 底層 + 測試 Route）
    │
    ▼
US-002（達標 LINE + check-prices 整合）
    │
    ▼
US-003（Vercel Cron + secret + GET）
```

（隱含前提：主專案已完成 Supabase watchlist、Yahoo 查價、`/api/check-prices` 既有流程 — 見 `docs/init-project-features/user-stories`。）

---

## 依賴說明

- **US-001** 無程式內前置 US；需自行完成 LINE Developers channel 與本機／Vercel 環境變數。
- **US-002** 必須在 US-001 完成後實作，否則無法發送 LINE；並依賴既有後端查價與 `watchlist`。
- **US-003** 必須在 US-002 完成後實作，確保定時觸發走的是已驗證之檢查與通知邏輯。

---

## 建議開發順序

| Wave | 內容 | 可否平行 |
| --- | --- | --- |
| **Wave 1** | US-001 | 單線進行 |
| **Wave 2** | US-002 | 須待 Wave 1 |
| **Wave 3** | US-003 | 須待 Wave 2 |

US-002 與 US-003 已依主 [`docs/spec.md`](../../spec.md)：**Telegram 優先**，選用 LINE 時兩者皆成功才標記 `is_notified`；Cron 使用 **`/api/cron/check-prices`**，與前端呼叫之 **`/api/check-prices`** 共用同一檢查實作。
