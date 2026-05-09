# AGENTS.md

**CURRENT MODE：`PROTOTYPE`（快速做完）**  
  
本檔由 `npm run ai:prototype` 覆寫生效；細則見 [`.cursor/rules/`](.cursor/rules/)（與 [`rules-switch/modes/prototype/rules/`](rules-switch/modes/prototype/rules/) 同源）與 [`docs/spec.md`](docs/spec.md)。切換至維護模式：`npm run ai:production`。

## Mode Goal｜本模式目標

- **優先**：在 spec 允許範圍內 **盡快可驗收、可部署**。
- **取捨**：可接受較扁平、較少抽象、較少的檔案切分與較輕的文件；**不低於下列「共通底線」**。

## Common Baselines｜共通底線（任何模式皆不可違反）

這些項目與 spec／資安一致；**不可用「求快」略過**：

- **規格**：產品行為、MVP 範圍、技術棧與驗收以 [`docs/spec.md`](docs/spec.md) 為準；Agent 文件只定義工作模式與品質門檻。
- **範圍**：不主動擴充登入、多使用者隔離、投資建議、LINE、付費等 MVP 外項目。

---

1. **機密**：所有 secrets／privileged credentials／webhook secrets 僅能在 **Server**／Route Handler／Server Action 使用；只有明確 public-safe 的值可用 `NEXT_PUBLIC_*`。
2. **輸入驗證**：股票代號、目標價須在邊界驗證；**無效資料不寫入 Supabase**（錯誤文案見 spec）。
3. **通知一致性**：**僅在 Telegram 發送成功後**，才將 `is_notified` 設為 `true` 並寫入 `notified_at`。
4. **錯誤體驗**：股價 API 等失敗時，UI 須有可讀繁中提示（例如「目前無法取得股價資料，請稍後再試」）；避免整頁 uncaught crash。

## Role｜角色定位

- 你是協助本專案的工程助手，以 **Next.js App Router + TypeScript** 完成課程 MVP。
- 與使用者溝通：**繁體中文為主**，技術名詞可英文。

## Project Context｜專案背景（精簡）

- **股價投資看板**：完整台股代號（例如 `2330.TW`）+ 目標價 → Yahoo 報價 → Supabase `watchlist` → 達標 Telegram。
- **技術棧**：以 [`docs/spec.md`](docs/spec.md) §3 為準；本檔不重複維護選型細節。

## Architecture｜架構（Prototype 態度）

- `app/` 為 UI 與路由；機密／寫 DB／發 Telegram：**server 端**處理。
- **可先**將邏輯放在較少的檔案或 route 內；若重複第三次再抽 helper。**不要**為漂亮架構擋住 spec 交付。

## MVP Scope｜範圍

- 對照 [`docs/spec.md`](docs/spec.md) §4；刻意不做項目同 spec §4「先不做」。

## Engineering Principles｜程式風格（本模式弱化）

- **速度 > 過度設計**。`any`：**盡量少用**；若省時可短暫使用並加 **TODO** 說明收斂方式。
- **測試**：不強制；能跑、`npm run build`／`npm run lint`／`npm run typecheck` 盡可能保持綠。
- **Clean Architecture / SOLID**：**不要求**一步到位；新建檔時仍避免把機密與 UI 混在一起。

## Workflow｜建議流程

1. 讀相關 spec 段落。  
2. 小步交付、對照驗收。  
3. 產品範圍／未決決策寫入 [`docs/spec.md`](docs/spec.md) §12；implementation debt 用 **TODO**、PR notes 或專門技術債文件追蹤。  
4. 上線／課程展示前：**`npm run ai:production`** 收斂品質。

## Commands｜指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本機開發 |
| `npm run build` | 建置 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TS 檢查 |
| `npm run ai:prototype` | 切換 AI 規則為 Prototype |
| `npm run ai:production` | 切換 AI 規則為 Production |

## Environment & Secrets

見 [`docs/spec.md`](docs/spec.md) §10；值不入庫。

## Current State｜現況

- 即時股價更新已定案為 **前端輪詢**：**固定 60 秒**間隔，每一輪刷新**股價結果區**（若有）與**追蹤清單內每一筆**（見 [`docs/spec.md`](docs/spec.md) §4「前端輪詢（定案）」）。
- 其餘詳見 [`docs/spec.md`](docs/spec.md) 與 repo 現況；切換命令見本檔 Commands，切換實作見 [`scripts/switch-ai-mode.mjs`](scripts/switch-ai-mode.mjs)，設計說明見 [`rules-switch/chat-gpt/ai-rule-switch-guideline.md`](rules-switch/chat-gpt/ai-rule-switch-guideline.md)。
