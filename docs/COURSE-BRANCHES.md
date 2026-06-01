# 課程分支說明

本 repo 依課程階段提供多條分支。**請勿在 `course/live-build` 上開發作業**；該分支僅供對照完整解答。

## 分支對照

| 分支 | 學員預設 checkout？ | 程式 | 文件 | Supabase migration |
|------|---------------------|------|------|--------------------|
| **`course/student-starter`** | 是（建議設為 GitHub Default branch） | 工具鏈 + 可 build 空殼 | [`docs/spec.md`](spec.md)、[`docs/user-stories/`](user-stories/)（AC 全 `[ ]`）、[`docs/line-push-vercel-cron/`](line-push-vercel-cron/) | **無** |
| **`course/student-advanced-features`** | 加分章節起點 | 主線 MVP 已完成（查價、watchlist、輪詢、Telegram） | 主線 US 全 `[x]`；LINE/Cron US 為 `[ ]` | **無** |
| **`course/live-build`** | 否（唯讀對答案） | 完整解答（含 LINE、Vercel Cron、migration） | 教師／錄課用 | **有**（僅此分支） |
| **`demo`** | 否 | 除錯情境展示 | [`docs/debug-scenarios.md`](debug-scenarios.md) 等 | 視分支 |

> **已棄用：** 遠端 `feat/advanced-features` 請改使用 `course/student-advanced-features`。

## 建議學習路徑

1. **主線實作：** `course/student-starter` → 依 [`docs/user-stories/US-01.md`](user-stories/US-01.md)～[US-06](user-stories/US-06.md) 自行完成。
2. **加分實作：** 主線完成後 checkout `course/student-advanced-features` → 依 [`docs/line-push-vercel-cron/user-stories/`](line-push-vercel-cron/user-stories/) 完成 US-001～003。
3. **卡關對答案：** 唯讀參考 `course/live-build`（見下方指令）。

## 無 migration 政策

`course/student-starter` 與 `course/student-advanced-features` **不包含** `supabase/migrations/`。

- **US-02** 建表請依 [`docs/user-stories/US-02.md`](user-stories/US-02.md) 技術備註自行在 Supabase SQL Editor 執行。
- 若需參考完整 SQL，請對照解答分支：

```bash
git fetch origin course/live-build
git show origin/course/live-build:supabase/migrations/001_create_watchlist.sql
```

## 對答案（唯讀 `course/live-build`）

```bash
# 取得最新解答分支
git fetch origin course/live-build

# 檢視單一檔案（不切換工作分支）
git show origin/course/live-build:lib/yahoo-finance.ts

# 並排對照（推薦）
git worktree add ../stock-tracker-answer origin/course/live-build
# 完成後：git worktree remove ../stock-tracker-answer
```

## 教師／Repo 維護

| 項目 | 建議 |
|------|------|
| GitHub Default branch | `course/student-starter` |
| `course/live-build` | Branch protection：僅 maintainers 可 push |
| 重生學員分支 | `node scripts/bootstrap-course-branches.mjs starter` / `advanced` |

## 相關文件

- 產品規格：[`docs/spec.md`](spec.md)
- 主線 User Stories：[`docs/user-stories/`](user-stories/)
- LINE / Cron 加分：[`docs/line-push-vercel-cron/`](line-push-vercel-cron/)
