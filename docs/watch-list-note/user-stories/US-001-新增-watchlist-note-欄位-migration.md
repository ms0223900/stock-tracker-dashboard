### US-001：新增 watchlist `note` 欄位（Migration）

**作為** 開發者
**我想要** 在 Supabase `watchlist` 資料表新增 `note` 欄位
**以便** 追蹤清單備註可持久化儲存，並讓 US-003／US-004 的 insert／update E2E 驗收通過

**開發階段**：後端補（有空再作）；**不阻擋**前端 US-002～US-004 先行開發 UI 與 Supabase client 串接程式。

**輸入格式**：
- 既有 migration：[`supabase/migrations/001_create_watchlist.sql`](../../../supabase/migrations/001_create_watchlist.sql)、[`002_add_currency.sql`](../../../supabase/migrations/002_add_currency.sql)
- 規格：[`docs/watch-list-note/watchlist-note-crud.md`](../watchlist-note-crud.md) §4 DB Schema

**輸出格式**：

**資料庫**：
- 新增 `supabase/migrations/003_add_note.sql`：
  - `ALTER TABLE watchlist ADD COLUMN note TEXT NULL;`（或等價 `ADD COLUMN IF NOT EXISTS` 寫法，依 repo 慣例）
  - 預設 `NULL`（無備註）
  - **不**變更既有 RLS policy（沿用 public read/write）

**不包含**（由前端 US 負責）：
- `types/watchlist.ts` 的 `WatchlistItem.note` → 見 US-003
- 任何 React／hook 程式碼

**驗收條件**：
- [ ] migration 檔存在且可於全新／既有環境套用（接在 002 之後）
- [ ] 套用後 `watchlist` 具 `note` 欄位，型別 `text`，可為 `NULL`
- [ ] 既有列 `note` 為 `NULL`，查詢不報錯
- [ ] `select *` 回傳含 `note` 欄位
- [ ] RLS 仍允許 anon 之 SELECT／INSERT／UPDATE／DELETE（與 001 一致）
- [ ] 套用 US-001 後，US-003「確認更新」可將備註寫入 DB 並於重新整理後仍存在
- [ ] 套用 US-001 後，US-004 儲存追蹤可將選填備註寫入 DB

**暫行替代（非本 US 交付物）**：
- 若需先測 E2E、尚未執行 migration 檔，可於 Supabase Dashboard 手動新增 `note TEXT NULL`；正式交付仍以本 US migration 為準。

**依賴關係**：
- 既有 US-005（Supabase `watchlist` 基礎）
- 軟依賴：US-003、US-004 前端程式就緒後，本 US 完成即解鎖其持久化驗收

**優先級**：P2
**相關功能**：追蹤清單備註 CRUD（[`watchlist-note-crud.md`](../watchlist-note-crud.md)）；資料庫 migration
