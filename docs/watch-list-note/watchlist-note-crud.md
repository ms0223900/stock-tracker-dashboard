# AI 開發規格：追蹤清單備註 CRUD

> **來源 Ticket**：追蹤清單的每個股票標的，可以加上「備註」。此備註可以 CRUD。  
> **產出日期**：2026-06-15  
> **對齊專案**：`docs/spec.md` §7 `watchlist`、US-008（追蹤清單 CRUD）、US-012（幣別欄位擴充模式）  
> **產品決策**：2026-06-15 灰區已定案（見文末 §6.二）

### 產品決策摘要（已定案）

| # | 議題 | 決策 |
| --- | --- | --- |
| G2 | 新建追蹤時同屏輸入備註 | **可以**，目標價表單下方加選填欄位；**不強制**填寫 |
| G3 | 無備註時 UI | 顯示 **「尚無備註」** 次要文案，並可於 input 內編輯 |
| G4 | 刪除／更新互動 | 備註為卡片上 **一般 input**；**僅**按「確認更新」才寫入 DB；**無**獨立刪除 confirm；清空後確認更新 = `note = null` |
| G6 | 欄位命名 | DB／型別 **`note`**，UI 文案 **「備註」** |

---

## Context 摘要

| 項目 | 說明 |
| --- | --- |
| **Problem** | 使用者僅能儲存 `symbol`、`target_price` 等欄位，無法為每筆追蹤標的記錄個人化說明（例如買進理由、停損策略、提醒事項）。 |
| **Goal** | 每筆 `watchlist` 項目可附加一則「備註」文字；使用者可建立、讀取、更新、刪除（清空）備註，且重新整理頁面後資料仍保留於 Supabase。 |
| **Impacted Areas** | `supabase/migrations/`、`types/watchlist.ts`、`lib/validation.ts`、`hooks/useWatchlist.ts`、`components/WatchlistCard.tsx`、（可選）儲存追蹤表單區塊 |
| **Stakeholders** | 終端使用者（課程 MVP 單一使用者、無登入隔離） |

---

## 1. 核心 User Story (Core User Stories)

### Story A — 建立備註（Create）

As a **使用者**, I want **在儲存追蹤項目時可選填備註，或於既有追蹤卡片上新增備註**, So that **我能記錄為何追蹤該標的**。

### Story B — 讀取備註（Read）

As a **使用者**, I want **在追蹤清單卡片上看到每筆的備註內容（若有）**, So that **我不必離開看板即可回顧自己的筆記**。

### Story C — 更新備註（Update）

As a **使用者**, I want **編輯既有追蹤項目的備註並儲存**, So that **我能隨市場或策略調整更新說明**。

### Story D — 刪除備註（Delete）

As a **使用者**, I want **清除某筆追蹤的備註內容（不刪除整筆追蹤）**, So that **我能移除過時筆記而保留股價追蹤設定**。

---

## 2. 功能細節 (Functional Specs)

### For Story A（Create）

**資料庫**

- 新增 migration `003_add_note.sql`（檔名序號依 repo 現有 migration 遞增）：
  - 欄位：`note TEXT NULL`
  - 預設：`NULL`（無備註）
  - 不變更既有 RLS policy（沿用 public read/write，與 `001_create_watchlist.sql` 一致）

**型別**

- `WatchlistItem` 新增：`note: string | null`

**驗證**（`lib/validation.ts`）

- 新增 `validateWatchlistNote(value: string): ValidationResult`
- 規則：
  - 允許空字串／僅空白 → 視為「無備註」，寫入 DB 時正規化為 `null`
  - 去除首尾空白後長度 ≤ **500** 字元（UTF-8 字元數，非 byte）
  - 超過上限：回傳 `{ valid: false, error: "備註不可超過 500 字" }`
  - 不限制換行；允許常見標點與中英文

**儲存追蹤（新建）**

- 目標價表單下方提供**選填**備註 input（`textarea`）；使用者**可不填**仍成功儲存追蹤
- `hooks/useWatchlist.ts` 的 `handleSave()`：
  - 若有填備註，先呼叫 `validateWatchlistNote`；無效則不寫入 DB、顯示錯誤
  - `insert` payload 可含 `note`（已驗證並 trim；全空白則省略或送 `null`）
- 備註為**選填**；未填不阻擋儲存追蹤（與 `target_price` 必填不同）

**既有項目新增備註**

- 於卡片備註 input 輸入內容後，按「確認更新」寫入（見 Story C）

### For Story B（Read）

**顯示**（`components/WatchlistCard.tsx`）

- 每張卡片在 symbol／價格區塊下方（建議於 sparkline 上方或狀態徽章上方）顯示備註區：
  - 標籤：**備註**
  - 控制項：一般 `<textarea>`（非唯讀展示＋另開編輯模式）
  - `note` 為 `null` 或空：input 為空，placeholder 顯示次要文案 **「尚無備註」**
  - 有內容：input 預填 DB 值；使用者可直接在 input 內修改
- 重新整理頁面、`fetchWatchlist()`、`select("*")` 後 input 初始值與 DB 一致
- 60 秒輪詢更新股價時**不覆寫**使用者尚未「確認更新」的本地 input 草稿；輪詢合併 DB 資料時，若該卡片無未儲存變更，則以 DB `note` 更新 input

### For Story C（Update）

**互動（已定案）**

- 備註為卡片上常駐的 **一般 input**；變更內容在按下「確認更新」前**不寫入** DB
- 按鈕：
  - **確認更新**：驗證並 persist
  - **取消**（建議）：還原 input 為上次已儲存的 DB 值，捨棄未儲存草稿
- **確認更新**流程：
  1. `validateWatchlistNote`（含清空 → 正規化為 `null`）
  2. `supabase.from("watchlist").update({ note: normalizedValue, updated_at: new Date().toISOString() }).eq("id", item.id)`
  3. 成功：更新本地 state（或 `fetchWatchlist()`）；input 與 DB 同步
  4. 失敗：顯示繁中錯誤，例如「備註儲存失敗，請稍後再試」（可附 `error.message`），保留使用者草稿

**併發**

- 同一卡片「確認更新」進行中 disable 按鈕

### For Story D（Delete）

**語意**

- 「刪除備註」= 將 `note` 設為 `null`，**不**刪除 `watchlist` 整列

**互動（已定案）**

- **無**獨立「刪除備註」按鈕，**無**刪除專用 confirm
- 使用者清空備註 input 後按 **「確認更新」**，即執行 `update({ note: null, updated_at: ... })`
- 成功後 placeholder 回到「尚無備註」，追蹤項目其餘欄位不變

---

## 3. 驗收標準 (Acceptance Criteria)

### Story A — Create

- **Scenario 1（選填建立）**  
  Given 使用者已查詢 `2330.TW` 且目標價有效  
  When 儲存追蹤時不填備註  
  Then Supabase 新增一筆 `note IS NULL`，清單正常顯示

- **Scenario 2（帶備註建立）**  
  Given 使用者輸入備註「長期持有，等財報」  
  When 點擊儲存追蹤且目標價有效  
  Then DB `note` 為 trim 後字串，卡片顯示該備註

- **Scenario 3（驗證失敗）**  
  Given 備註超過 500 字  
  When 使用者嘗試儲存  
  Then 不寫入 DB，畫面顯示「備註不可超過 500 字」

### Story B — Read

- **Scenario 4（持久化讀取）**  
  Given DB 中某筆 `note = '測試備註'`  
  When 使用者重新整理頁面  
  Then 對應卡片顯示「測試備註」

- **Scenario 5（輪詢不影響備註）**  
  Given 卡片已有備註  
  When 60 秒輪詢更新 `last_price`  
  Then 備註文字不變

### Story C — Update

- **Scenario 6（編輯成功）**  
  Given 卡片 input 現有備註「舊內容」  
  When 使用者改為「新內容」並按「確認更新」  
  Then DB 與 input 皆為「新內容」，`updated_at` 已更新

- **Scenario 6b（未確認不寫入）**  
  Given 卡片 input 現有備註「舊內容」  
  When 使用者改為「草稿」但**未**按「確認更新」  
  Then DB 仍為「舊內容」

- **Scenario 7（更新失敗）**  
  Given Supabase update 失敗  
  When 使用者按「確認更新」  
  Then 顯示可讀繁中錯誤，不 silent fail，input 保留草稿

### Story D — Delete

- **Scenario 8（清空後確認更新）**  
  Given 卡片 input 有備註  
  When 使用者清空 input 並按「確認更新」  
  Then DB `note` 為 `null`，追蹤項目仍存在，symbol／target_price 不變，placeholder 為「尚無備註」

---

## 4. 技術邊界 (Technical Boundaries)

### DB Schema

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `note` | `TEXT` | 否 | 使用者備註；`NULL` = 無備註 |

- 不需新 table；不需 index（MVP 清單規模小）
- Migration 需可重複套用於全新環境與既有 `002_add_currency` 之後

### API & Permissions

- **無新增 Route Handler**；沿用 client Supabase + 既有 RLS（anon public CRUD）
- 備註驗證在 client 邊界執行（與 `target_price` 相同模式）；**無效不寫入 DB**
- 機密規則不變：備註不含 server-only secrets

### External Services

- Yahoo Finance、Telegram、LINE：**不讀寫** `note`
- **資訊缺失**：Ticket 未說明達標 Telegram／LINE 通知是否應包含備註 → 預設 **不包含**（維持現有通知格式）

### Performance / SLO

- 單筆 `note` ≤ 500 字，對 `select *` 與卡片渲染無額外 SLO
- Ticket **未提供**具體 latency 指標 → 不自行訂立數字

---

## 5. MVP 判定 (MVP vs Later)

| 項目 | MVP | 說明 |
| --- | --- | --- |
| DB `note` 欄位 + 型別 | ✅ true | 資料持久化前提 |
| Read（卡片顯示） | ✅ true | CRUD 之 R |
| Update + Delete（清空） | ✅ true | Ticket 明確要求 CRUD |
| Create 於「儲存追蹤」表單選填 | ✅ true | 提供選填欄位；**不強制**填寫即可儲存 |
| Create 僅能事後在卡片 input 新增 | ✅ true | 卡片「確認更新」路徑為主要 Update/Delete 入口 |
| 備註寫入 Telegram 通知 | ❌ false | Ticket 未要求；避免通知文案膨脹 |
| 備註搜尋／篩選 | ❌ false | 超出 Ticket |
| Server Action 集中驗證 | ❌ false | 與現有 prototype 模式一致，client 驗證即可 |
| 富文本／Markdown | ❌ false | 純文字即可 |

---

## 6. 資訊缺失與風險 (Missing Info / Risks / Notes)

### 一、開發實作時應注意 (Implementation-time Concerns)

- **狀態合併**：`useWatchlist` 的 `mergeWatchlistFromDb` 與輪詢邏輯僅合併 `last_price`／`previousClose`；擴充時勿覆寫 `note`。
- **錯誤一致性**：備註 update/delete 失敗應顯示繁中 UI 提示（對齊 US-008 刪除失敗僅 `console.error` 的已知債務，本功能建議一開始就做可見錯誤）。
- **UI 佈局**：卡片已含價格、sparkline、狀態徽章；備註 `textarea` 需避免擠壓行動版版面，以 `break-words` 處理長字串。
- **草稿狀態**：輪詢 refetch 時須辨識「該卡片是否有未確認的 input 草稿」，避免覆蓋使用者正在編輯的內容。
- **無障礙**：`textarea` 需 `aria-label`（例如 `2330.TW 備註`）；錯誤訊息與 input 關聯；「確認更新」按鈕需明確 label。

### 二、規格決策紀錄（已定案，2026-06-15）

| # | 議題 | 決策 |
| --- | --- | --- |
| G1 | 備註最大長度 | **500 字** |
| G2 | 新建追蹤時是否同屏輸入備註 | **可以**；表單加選填欄位，**不強制**填寫 |
| G3 | 無備註時 UI | 顯示 placeholder **「尚無備註」** |
| G4 | 刪除／更新互動 | 一般 input；**僅「確認更新」寫 DB**；無刪除 confirm；清空後確認更新 = 刪除 |
| G5 | 達標通知是否帶備註 | **否** |
| G6 | 欄位命名 | DB／型別 **`note`**，UI **「備註」** |

### 三、動態詢問與邊界調整 (Runtime/Dynamic Clarifications)

- 使用者貼上極長單行無空格字串導致卡片破版 → 以 `break-words` 處理。
- 多裝置同時編輯同一筆（無登入、單使用者 MVP 機率低）→ 後寫入覆蓋先寫入；若需衝突提示列為後續優化。
- Emoji、全形字元計入 500 字上限之計數方式需在實作時與 `validateWatchlistNote` 單元行為一致（建議 `Array.from(str).length` 或等價 Unicode 字元計數）。

---

## 建議實作順序（供 AI Agent）

1. Migration `003_add_note.sql` + `WatchlistItem.note`
2. `validateWatchlistNote` + 錯誤常數
3. `useWatchlist`：`handleSave` 支援選填 `note`；新增 `handleUpdateNote(id, value)`（含清空 → `null`）
4. `WatchlistCard`：常駐 `textarea` +「確認更新」／「取消」；無獨立刪除按鈕
5. 儲存追蹤表單：選填備註 `textarea`（不強制）
6. 手動驗收 AC Scenario 1–8；`npm run build` / `lint` / `typecheck`
