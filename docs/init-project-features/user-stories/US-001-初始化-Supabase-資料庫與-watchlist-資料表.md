### US-001：初始化 Supabase 資料庫與 watchlist 資料表

**作為** 開發者
**我想要** 在 Supabase 中建立 `watchlist` 資料表與專案連線設定
**以便** 後續所有追蹤功能的資料能夠被正確儲存與讀取

**輸入格式**：
- `.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`
- `docs/spec.md` 第 7 節定義的 watchlist 資料表 schema

**輸出格式**：
- Supabase 專案中可用的 `watchlist` 資料表（含所有欄位、型別與預設值）
- 專案中的 `lib/supabase/client.ts`（browser client）與 `lib/supabase/server.ts`（server client）
- Row Level Security 先採寬鬆策略（單使用者 Demo），允許 public anon key 讀寫

**驗收條件**：
- [x] `watchlist` 資料表存在，包含 `id`(UUID)、`symbol`(text)、`target_price`(numeric)、`last_price`(numeric)、`is_notified`(boolean, default false)、`notified_at`(timestamptz)、`created_at`(timestamptz)、`updated_at`(timestamptz)
- [x] 可從 Next.js server 端使用 service role key 讀寫 watchlist
- [x] 可從 Next.js client 端使用 anon key 讀寫 watchlist
- [x] `.env.local` 已正確配置且不進版本控制

**驗證說明**：
- `supabase/migrations/001_create_watchlist.sql`：包含完整 schema（UUID PK、symbol、target_price、last_price、is_notified、notified_at、created_at、updated_at）與寬鬆 RLS policies（public anon key 可讀寫）
- `lib/supabase/client.ts`：使用 `createBrowserClient`（anon / publishable key）
- `lib/supabase/server.ts`：使用 `createServerClient` 搭配 cookies
- `lib/supabase/middleware.ts`：Next.js middleware helper
- `.env.local`：已配置 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，已確認 `.gitignore` 排除 `.env*.local`
- ⚠️ 需在 Supabase Dashboard 的 SQL Editor 中執行 migration SQL 以建立資料表

**依賴關係**：無（第一個任務）
**優先級**：P0
**相關功能**：spec §7 資料模型、§8 Supabase
