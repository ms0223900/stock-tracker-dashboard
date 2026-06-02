# 股價投資看板 · Stock Tracker Dashboard

課程用 MVP：輸入台股代號與目標股價，查詢即時報價、儲存追蹤清單，並在股價達標時透過 Telegram 發送通知。

> 資料僅供課程 Demo，非投資建議。

## 功能概覽


| 功能   | 說明                                                      |
| ---- | ------------------------------------------------------- |
| 即時查價 | 輸入完整代號（如 `2330.TW`），顯示目前股價、OHLC 與當日走勢圖                  |
| 追蹤清單 | 儲存目標股價至 Supabase `watchlist`，卡片含 sparkline              |
| 自動更新 | 前端每 **60 秒**輪詢，刷新股價結果區與清單內每一筆                           |
| 達標通知 | 股價 ≥ 目標價且尚未通知時，透過 Telegram Bot 推送（成功後才標記 `is_notified`） |
| 部署   | 可部署至 Vercel 公開使用                                        |


完整產品規格見 `[docs/spec.md](docs/spec.md)`。

## 技術棧

- **Framework**：Next.js 16（App Router）
- **Language**：TypeScript
- **Styling**：Tailwind CSS 4
- **Chart**：Recharts
- **Database**：Supabase（PostgreSQL）
- **Stock API**：Yahoo Finance chart API
- **Notification**：Telegram Bot API
- **Deploy**：Vercel

## 環境需求

- [Node.js](https://nodejs.org/) **18+**（建議 20 或 22 LTS）
- [npm](https://www.npmjs.com/)（隨 Node 安裝）
- [Supabase](https://supabase.com/) 專案（免費方案即可）
- [Telegram Bot](https://core.telegram.org/bots)（達標通知用）
- （選用）[Vercel](https://vercel.com/) 帳號，用於部署

## 安裝

```bash
# 1. Clone 專案（作業請 clone 本機或 fork 後 clone 自己的 repo，見下方「作業流程」）
git clone <repository-url>
cd stock-tracker-dashboard

# 2. 安裝依賴
npm install

# 3. 複製環境變數範本
cp .env.example .env.local
```

## 環境變數設定

編輯 `.env.local`，填入以下值（**勿提交至 Git**）：


| 變數                              | 必填  | 說明                              |
| ------------------------------- | --- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | 是   | Supabase 專案 URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是   | Supabase anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY`     | 建議  | Server 端寫入用（僅後端，勿暴露到 client）    |
| `TELEGRAM_BOT_TOKEN`            | 是*  | Telegram Bot Token              |
| `TELEGRAM_CHAT_ID`              | 是*  | 接收通知的 Chat ID                   |


 若尚未實作 US-04（Telegram 通知），可先略過；查價與追蹤清單仍可使用。

延伸功能（LINE Push、Vercel Cron）另需 `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_USER_ID`、`CRON_SECRET`，詳見 `[docs/line-push-vercel-cron/spec.md](docs/line-push-vercel-cron/spec.md)`。

### Supabase 建表

學員分支**不含** `supabase/migrations/`，請在 Supabase Dashboard → **SQL Editor** 自行建立 `watchlist` 表。欄位定義見 `[docs/user-stories/US-02.md](docs/user-stories/US-02.md)` 技術備註。

卡關時可對照解答分支的 SQL：

```bash
git fetch origin course/live-build
git show origin/course/live-build:supabase/migrations/001_create_watchlist.sql
```

### Telegram Bot 快速設定

1. 在 Telegram 找 [@BotFather](https://t.me/BotFather)，建立 Bot 並取得 `TELEGRAM_BOT_TOKEN`。
2. 對你的 Bot 傳任意訊息，再呼叫 `https://api.telegram.org/bot<TOKEN>/getUpdates` 取得 `chat.id` 作為 `TELEGRAM_CHAT_ID`。
3. 將兩者填入 `.env.local`。

## 啟動開發伺服器

```bash
npm run dev
```

瀏覽器開啟 [http://localhost:3000](http://localhost:3000)。

其他常用指令：


| 指令                  | 用途                            |
| ------------------- | ----------------------------- |
| `npm run build`     | 正式建置                          |
| `npm run start`     | 以 production 模式啟動（需先 `build`） |
| `npm run lint`      | ESLint 檢查                     |
| `npm run typecheck` | TypeScript 型別檢查               |


## 如何開發（課程學習路徑）

本 repo 依課程階段提供多條分支，**請依課程平台提供的教學影片**逐步實作；影片章節通常對應下方 User Story 順序。

> 分支詳細說明：`[docs/COURSE-BRANCHES.md](docs/COURSE-BRANCHES.md)`

### 0. 作業流程（Clone 或 Fork）

本 repo 為**公開課程教材**；除維護者外，學員僅能 **讀取、clone、fork**，**無法 push 至課程 upstream**。請擇一方式在本機完成作業：

| 方式 | 適合情境 | 說明 |
| ---- | -------- | ---- |
| **A. Clone 到本機** | 只在本地練習、尚未需要 GitHub 備份 | 最簡單；commit 可只留在本機 |
| **B. Fork 到自己的 GitHub** | 要備份程式、要接 Vercel 部署（US-06） | Fork 後 push 到自己的 repo，不影響課程 upstream |

**共通注意事項**

- 作業請在 `course/student-starter`（或加分章節的 `course/student-advanced-features`）上開發；**勿在 `course/live-build` 練習**（該分支僅供對答案）。
- `.env.local` 含機密，**勿提交至 Git**（已在 `.gitignore`）。
- 無需也不應向課程 repo 申請 Write 權限。

**方式 A：Clone 到本機**

```bash
git clone <repository-url>
cd stock-tracker-dashboard
git checkout course/student-starter   # 主線起點；加分章節改 checkout student-advanced-features

cp .env.example .env.local
npm install
npm run dev
```

**方式 B：Fork 後 Clone 自己的 Repo**

1. 在 GitHub 對本 repo 按 **Fork**，複製到你自己的帳號下。
2. Clone **你的 fork**（不是你的 fork 請將 `<your-username>` 換成你的 GitHub 帳號）：

```bash
git clone https://github.com/<your-username>/stock-tracker-dashboard.git
cd stock-tracker-dashboard
git checkout course/student-starter

cp .env.example .env.local
npm install
npm run dev
```

3. 日常 commit / push 目標為 **自己的 fork**：

```bash
git add .
git commit -m "完成 US-01 即時查價"
git push origin course/student-starter   # 或 push 到你自己建立的分支
```

若課程 upstream 有更新（例如修正文件），可從 upstream 同步：

```bash
git remote add upstream <repository-url>   # 僅第一次需要
git fetch upstream
git merge upstream/course/student-starter  # 或 rebase，擇一即可
```

### 1. 確認分支


| 分支                                 | 用途                                      |
| ---------------------------------- | --------------------------------------- |
| `course/student-starter`           | **學員起點**：空殼 + 規格文件，自行完成主線               |
| `course/student-advanced-features` | **加分起點**：主線 MVP 已完成，實作 LINE / Cron 進階功能 |
| `course/live-build`                | **完整解答**（唯讀對照，勿在此分支練習）                  |


```bash
# 主線起點
git checkout course/student-starter

# 或加分章節起點（主線已完成）
git checkout course/student-advanced-features
```

### 2. 依 User Story 實作

主線任務（建議順序）：


| US    | 主題                   | 文件                                                         |
| ----- | -------------------- | ---------------------------------------------------------- |
| US-01 | 即時股價查詢               | `[docs/user-stories/US-01.md](docs/user-stories/US-01.md)` |
| US-02 | 追蹤項目儲存               | `[docs/user-stories/US-02.md](docs/user-stories/US-02.md)` |
| US-03 | 前端輪詢更新               | `[docs/user-stories/US-03.md](docs/user-stories/US-03.md)` |
| US-04 | Telegram 達標通知        | `[docs/user-stories/US-04.md](docs/user-stories/US-04.md)` |
| US-05 | 走勢圖 / sparkline / 刪除 | `[docs/user-stories/US-05.md](docs/user-stories/US-05.md)` |
| US-06 | Vercel 部署            | `[docs/user-stories/US-06.md](docs/user-stories/US-06.md)` |


加分任務（LINE Push + Vercel Cron）：

- `[docs/line-push-vercel-cron/user-stories/](docs/line-push-vercel-cron/user-stories/)`

**建議流程**：看影片 → 對照 US 驗收條件（AC）→ 實作 → 本地 `npm run dev` 驗收 → `npm run build` 確認可建置。

### 3. 卡關時對答案

```bash
git fetch origin course/live-build

# 檢視單一檔案（不切換分支）
git show origin/course/live-build:lib/yahoo-finance.ts

# 並排對照（推薦）
git worktree add ../stock-tracker-answer origin/course/live-build
# 完成後：git worktree remove ../stock-tracker-answer
```

## 專案結構

```
stock-tracker-dashboard/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 主畫面
│   ├── actions/            # Server Actions
│   └── api/                # Route Handlers（Yahoo 代理、刪除、價格檢查等）
├── components/             # UI 元件
├── hooks/                  # Client hooks（查價、輪詢、儲存等）
├── lib/                    # 業務邏輯（Yahoo、Supabase、Telegram、驗證）
├── docs/
│   ├── spec.md             # 產品規格（Single Source of Truth）
│   ├── COURSE-BRANCHES.md  # 課程分支說明
│   └── user-stories/       # 主線實作任務
├── .env.example            # 環境變數範本
└── vercel.json             # Vercel 部署設定
```

## 部署至 Vercel

1. 將 repo 連結至 [Vercel](https://vercel.com/)（Import Git Repository）。
2. 在 Vercel 專案 **Settings → Environment Variables** 填入與 `.env.local` 相同的變數。
3. Deploy 後以公開 URL 驗收（查價、儲存追蹤、Telegram 通知）。

詳細步驟見 `[docs/user-stories/US-06.md](docs/user-stories/US-06.md)`。

## 常見問題

**Q：我可以 push 到課程 repo 嗎？**  
A：不行。課程 upstream 僅供閱讀與對照；請在本機開發，或 fork 到自己的 GitHub 後 push 至 **你的 fork**。部署 Vercel 時也請連結自己的 fork。

**Q：查價顯示「目前無法取得股價資料，請稍後再試」**  
A：確認代號格式（如 `2330.TW`）、網路連線，以及 Yahoo API 是否暫時不可用；可稍後重試。

**Q：儲存追蹤失敗**  
A：檢查 Supabase 環境變數、`watchlist` 表是否已建立，以及 RLS 是否允許寫入。

**Q：達標但沒收到 Telegram**  
A：確認 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID` 正確，且 Bot 已被加入對話；通知僅在 **Telegram 發送成功後** 才標記 `is_notified = true`。

**Q：CORS 或瀏覽器無法直連 Yahoo**  
A：專案已提供 `/api/yahoo-finance` Route Handler 作為代理，可改走 server 端查價。

## 相關文件

- 產品規格：`[docs/spec.md](docs/spec.md)`
- 課程分支：`[docs/COURSE-BRANCHES.md](docs/COURSE-BRANCHES.md)`
- AI / Agent 工作模式：`[AGENTS.md](AGENTS.md)`
- 設計稿：`[docs/design.pen](docs/design.pen)`

## 授權

本專案為課程教材用途。股價資料來自 Yahoo Finance 非官方 API，僅供學習展示，不構成任何投資建議。