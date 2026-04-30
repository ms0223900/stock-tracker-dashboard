# AGENTS.md

本檔為「高階、穩定、跨任務」的 Agent context；細節與情境規則見 [`.cursor/rules/`](.cursor/rules/) 與 [`docs/spec.md`](docs/spec.md)。

## Role｜角色定位

- 你是協助本專案的工程助手，以 **Next.js App Router + TypeScript** 交付可部署的課程 MVP。
- 優先 **可讀、可驗收、小步驟變更**；不主動擴大產品範圍（見下方 MVP 與禁止事項）。
- 與使用者溝通時 **繁體中文為主**，技術名詞可保留英文。

## Project Context｜專案背景

- **名稱**：股價投資看板（Stock Watch MVP）。
- **目的**：使用者輸入 **完整台股代號**（例如 `2330.TW`）與 **目標價**，查即時股價、將追蹤條件存入 Supabase，股價 **≥ 目標價** 且尚未通知時透過 **Telegram** 提醒。
- **技術棧**：Next.js App Router、TypeScript、Tailwind CSS、Recharts、Supabase、Yahoo Finance chart API、Telegram Bot API、Vercel。
- **規格單一來源**：行為、驗收、資料表與 API 細節以 [`docs/spec.md`](docs/spec.md) 為準；`AGENTS.md` 不重複貼上整份 spec。

## Architecture｜架構說明

- **前端與路由**：`app/`（App Router），目前主要頁面為 [`app/page.tsx`](app/page.tsx)、根版面 [`app/layout.tsx`](app/layout.tsx)。
- **樣式**：[`app/globals.css`](app/globals.css) + Tailwind。
- **機密與後端邏輯**：凡需 **Supabase service role**、**Telegram token**、或僅 server 可知的流程，應放在 **Route Handlers**（`app/api/.../route.ts`）或 **Server Actions**，**不可**透過 `NEXT_PUBLIC_*` 或純 client 外洩。
- **股價來源**：Yahoo Finance `v8/finance/chart/{symbol}`；建議集中於可測試的 typed helper（見 `.cursor/rules/nextjs.mdc`）。
- **資料**：Supabase 表 **`watchlist`**（欄位與流程見 spec §7–9）。
- **AI 規則分層**：跨檔案的型別／驗證／錯誤策略 → [`code-style.mdc`](.cursor/rules/code-style.mdc)；Next.js／Recharts／輪詢 → [`nextjs.mdc`](.cursor/rules/nextjs.mdc)；DB／RLS → [`supabase.mdc`](.cursor/rules/supabase.mdc)；達標通知 → [`telegram.mdc`](.cursor/rules/telegram.mdc)。

## MVP Scope｜範圍

- **必做**：完整代號輸入、查詢股價、儲存追蹤、達標 Telegram、錯誤提示、可部署 Vercel（對照 [`docs/spec.md`](docs/spec.md) §4 必做與 §11）。
- **可選／加分**：同日走勢圖（Recharts）、前端約 60 秒輪詢、刪除追蹤、Vercel Cron 背景檢查。
- **刻意不做**：登入與多使用者隔離、多股票完整管理、自動補 `.TW`、歷史股價庫存、技術分析與買賣建議、LINE、付費。

## Workflow｜建議工作流

1. **讀 spec**：變更行為前先對 [`docs/spec.md`](docs/spec.md) 相關段落。
2. **小步驟**：單一 PR／單一主題；可驗收再往下做。
3. **驗證與錯誤**：使用者輸入在邊界驗證；外部 API／DB 失敗要有 **繁中、可理解** 的 UI 或 API 錯誤訊息（見 spec 與 `code-style.mdc`）。
4. **文件**：刻意延後的功能或與 spec 的差異，寫入 [`docs/spec.md`](docs/spec.md)（例如 §12 未決問題或新增「刻意延後」條目）。
5. **機密**：永遠不將 token、service role、chat id 寫入 repo。

## Commands｜常用指令

在專案根目錄：

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本機開發（Next dev） |
| `npm run build` | 正式建置 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Environment & Secrets｜環境變數

與 [`docs/spec.md`](docs/spec.md) §10 一致（僅列名稱，值不放進版本庫）：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（僅 server）
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Do / Don't

| Do | Don't |
| --- | --- |
| 使用完整代號如 `2330.TW`，驗證失敗給 spec 規定之繁中提示 | 自動補 `.TW`、用中文名稱當代號 |
| Server 端處理機密與通知 | 在 client 或 `NEXT_PUBLIC_*` 暴露 service role / Telegram token |
| 與 `watchlist` 模型與通知流程一致 | 在 Telegram **發送成功之前**就把 `is_notified` 設為 `true` |
| 型別明確（股價、watchlist、通知結果） | 濫用 `any` 略過錯誤處理 |
| 依 MVP 範圍實作 | 主動加入登入、多商品投組、投資建議、LINE、付費 |

## Current State｜目前狀態

- Repo 已具 Next.js 16、React 19、Tailwind 4、Supabase client 依賴與 **說明用首頁**；完整查價、Supabase CRUD、Telegram 與圖表等仍依 **spec** 逐步實作。
- 未決議題可追蹤於 [`docs/spec.md`](docs/spec.md) §12（圖表是否必做、Cron vs 輪詢、RLS 策略、Chat ID 是否由使用者輸入等）。
