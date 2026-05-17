# AGENTS.md

**CURRENT MODE：`PRODUCTION`（長期維護）**  

本檔由 `npm run ai:production` 覆寫生效；細則見 [`.cursor/rules/`](.cursor/rules/)（與 [`rules-switch/modes/production/rules/`](rules-switch/modes/production/rules/) 同源）。切換回快速：`npm run ai:prototype`。

本檔為「高階、穩定、跨任務」的 Agent context；**行為／驗收**以 [`docs/spec.md`](docs/spec.md) 為單一事實來源，`AGENTS.md` 不重複整份 spec。

## Role｜角色定位

- 你是協助本專案的工程助手，以 **Next.js App Router + TypeScript** 交付 **可維護、可測試、可部署** 的程式。
- 優先：**可讀、可驗收、型別清楚、錯誤可追蹤**；變更小步驟、可 review。
- 與使用者溝通：**繁體中文為主**，技術名詞可保留英文。
- **不主動**擴充登入、多使用者隔離、投資建議、LINE、付費等 MVP 外範圍。

## Project Context｜專案背景

- **名稱**：股價投資看板（Stock Watch MVP）。
- **目的**：使用者輸入完整台股代號（例如 `2330.TW`）與目標價 → 查即時股價 → Supabase `watchlist` → 達標時 **Telegram** 提醒。
- **技術棧**：Next.js App Router、TypeScript、Tailwind CSS、Recharts、Supabase、Yahoo Finance chart API、Telegram Bot API、Vercel。

## Architecture｜架構說明

- **前端與路由**：`app/`（App Router），主要頁面 [`app/page.tsx`](app/page.tsx)、根版面 [`app/layout.tsx`](app/layout.tsx)。
- **樣式**：[`app/globals.css`](app/globals.css) + Tailwind。
- **機密與後端**：凡需要 **service role**、**Telegram token**、chat id 的流程，只能在 **Route Handlers**（`app/api/**/route.ts`）或 **Server Actions**；**不可**經由 `NEXT_PUBLIC_*` 或純 client 外洩。
- **股價**：集中於 typed、可單獨測試的 Yahoo helper。
- **資料**：Supabase `watchlist`（見 spec §7–9）。
- **規則分層**：[`code-style.mdc`](.cursor/rules/code-style.mdc)、[`nextjs.mdc`](.cursor/rules/nextjs.mdc)、[`supabase.mdc`](.cursor/rules/supabase.mdc)、[`telegram.mdc`](.cursor/rules/telegram.mdc)。

## MVP Scope｜範圍

- **必做／可選／先不做**：對照 [`docs/spec.md`](docs/spec.md) §4。

## Engineering Principles｜程式設計原則（本模式強化）

細節以各 `.cursor/rules/*.mdc` 為準；此處為高階錨點：

### Clean Code

- **命名即文件**、**短小函式**、**DRY**，但遵循 **YAGNI**——不為假想未來過度抽象。
- **顯式錯誤路徑**：避免 `catch {}`、避免靜默 `null`。

### SOLID（本專案語境）

| 原則 | 意義 |
| --- | --- |
| **S** | 查價／DB／Telegram **分離** |
| **O** | 新通知管道以 **新增模組**為主 |
| **L/I/D** | 依賴介面或小表面 API，不依賴具體實作細節堆疊 |

### Clean Architecture（輕量）

```
app/api/           ← Delivery
lib/               ← Application + Infrastructure 分區；domain types 不依賴 framework
```

- **依賴方向**：Delivery → Application → Infrastructure；Infrastructure **禁止** import Route Handler。
- **`StockQuote`、`WatchlistRow`、`NotificationResult` 等** 放在無框架耦合的 module（例如 `lib/types.ts`）。

### Production 追加要求

- **TypeScript**：**禁止無理由 `any`**；必要時 narrow + 註解 + 限期收斂。
- **測試**：核心純函数（validation、normalize quote、門檻比對）應有可跑測試；改行為時同步更新／新增測試（若尚未建測試框架，先以小步引入並註記於 spec）。
- **文件**：變更行為／驗收 → 同步 [`docs/spec.md`](docs/spec.md)；公開 API／cron 須可追溯說明。

## Workflow｜建議工作流

1. 讀 spec 相關段落。  
2. 驗證在邊界；外部 I/O 有 typed／明確錯誤分支。  
3. 小 PR、對照 §11 驗收意象。  
4. 不交 token／service role 入庫。

## Commands｜常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本機開發 |
| `npm run build` | 建置 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run ai:prototype` | AI 規則切換 Prototype |
| `npm run ai:production` | AI 規則切換 Production |

## Environment & Secrets

見 [`docs/spec.md`](docs/spec.md) §10。

## Do / Don't

| Do | Don't |
| --- | --- |
| 遵循 spec 驗證與繁中錯誤 | 自動補 `.TW`、略過輸入驗證寫 DB |
| Server 保管機密 | client 暴露 service role／Telegram |
| Telegram **成功後**更新 `is_notified` | 發送成功前提早標記 |
| 明確型別與模組邊界 | 大圈 `any`、跨層級耦合 |

## Current State｜目前狀態

- 即時股價更新已定案為 **前端輪詢**：**固定 60 秒**間隔，每一輪刷新**股價結果區**（若有）與**追蹤清單內每一筆**（見 [`docs/spec.md`](docs/spec.md) §4「前端輪詢（定案）」）。
- `/api/check-prices` 達標通知：預設 **Telegram**；若另設定 `LINE_CHANNEL_ACCESS_TOKEN` 與 `LINE_USER_ID`，於 Telegram 成功後再送 **LINE Push**，**兩者皆成功**才將 `is_notified` 設為 `true`（見 [`docs/spec.md`](docs/spec.md) 第八節 LINE、第九節）。
- **Vercel Cron**（選用）：`vercel.json` 設定對 `GET /api/cron/check-prices` 定時觸發；須設定 `CRON_SECRET`，與請求 `Authorization: Bearer` 一致（見 [`docs/spec.md`](docs/spec.md) 第十節）。**Vercel Hobby** 僅允許 Cron **每日一次**；更頻繁的 `schedule` 會在**部署時失敗**（見第十節原文摘要）。前端輪詢仍呼叫無密鑰之 `/api/check-prices`。
- 其餘以 repo 與 [`docs/spec.md`](docs/spec.md) 為準；規則切換見 [`scripts/switch-ai-mode.mjs`](scripts/switch-ai-mode.mjs)。

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **stock-tracker-dashboard** (594 symbols, 755 relationships, 16 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/stock-tracker-dashboard/context` | Codebase overview, check index freshness |
| `gitnexus://repo/stock-tracker-dashboard/clusters` | All functional areas |
| `gitnexus://repo/stock-tracker-dashboard/processes` | All execution flows |
| `gitnexus://repo/stock-tracker-dashboard/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
