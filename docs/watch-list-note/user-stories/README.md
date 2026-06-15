# User Stories：追蹤清單備註 CRUD

本目錄將「追蹤清單備註」拆成可獨立驗收的小任務，對齊 [`docs/watch-list-note/watchlist-note-crud.md`](../watchlist-note-crud.md)。  
**開發策略（已定案）**：**前端先行**（US-002 → US-003 → US-004），**後端再補** migration（US-001，有空再作）。

---

## US 一覽表

| US | 標題 | 優先級 | 階段 | 依賴 | 簡要說明 |
|----|------|--------|------|------|----------|
| **001** | 新增 watchlist `note` 欄位（Migration） | P2 | 後端補 | US-005 | `003_add_note.sql`；解鎖持久化 E2E |
| **002** | 實作備註輸入驗證 | P0 | 前端 Wave 1 | 無 | `validateWatchlistNote`，≤500 字 |
| **003** | 追蹤卡片備註顯示、更新與刪除 | P0 | 前端 Wave 2 | US-002, US-008, US-014, 輪詢 US-003 | 型別、`WatchlistCard` textarea、update 串接、草稿保護 |
| **004** | 儲存追蹤時支援選填備註 | P1 | 前端 Wave 3 | US-002, US-008；建議 US-003 | `StockResultCard` 選填備註、`handleSave` insert |

*表內「輪詢 US-003」指 init-project [`US-003`](../../init-project-features/user-stories/US-003-實作前端每-60-秒自動更新.md)（60 秒自動更新），與本目錄 US-003 不同編號空間。*

---

## 依賴關係圖

```
US-002 (備註驗證)
   │
   ├──→ US-003 (卡片 R/U/D + 型別 + update 串接)
   │         │
   │         ╎  E2E 持久化（虛線：待 DB 欄位）
   │         ╎
   │         └──··· US-001 (migration 後端補)
   │
   └──→ US-004 (儲存時選填備註 + insert)
             │
             └──··· US-001

既有：US-008 (追蹤清單) ──→ US-003, US-004
既有：US-014 (卡片佈局) ──→ US-003
既有：init US-003 (輪詢) ──→ US-003（草稿保護）
既有：US-005 (Supabase) ──→ US-001
```

---

## 依賴說明

- **US-002** 為前端起點，純 `lib/validation.ts`，無 DB 依賴。
- **US-003** 擴充 `WatchlistItem.note` 與卡片 UI；**不等 US-001** 即可驗 UI、互動、驗證與 `update` 程式路徑。
- **US-004** 擴充儲存追蹤表單；備註**選填、不強制**；建議 US-003 完成後驗證清單卡片是否顯示新備註。
- **US-001** 僅負責 migration；**P2、後端補**。完成後回頭驗 US-003／US-004 的 DB 持久化與重新整理場景。
- **暫行 E2E**：US-001 未完成前，可於 Supabase Dashboard 手動加 `note TEXT NULL` 測試；正式交付以 migration 為準。

---

## 建議開發順序（Wave）

| Wave | US | 說明 | 可平行 |
|------|-----|------|--------|
| **Wave 1** | US-002 | 備註驗證函式 | — |
| **Wave 2** | US-003 | 卡片備註 UI + update 串接 + 輪詢草稿 | — |
| **Wave 3** | US-004 | 儲存追蹤選填備註 | 可與 US-003 尾段部分平行 |
| **Wave 4** | US-001 | Migration（後端補） | 獨立撿起；完成後跑持久化 E2E |

---

## 明確不做

- Telegram／LINE 達標通知帶備註
- 備註搜尋／篩選
- 富文本／Markdown
- 新增 Route Handler 或 Server Action 集中驗證（沿用 client Supabase + client 驗證）

---

## 規格出處

- 功能規格：[`docs/watch-list-note/watchlist-note-crud.md`](../watchlist-note-crud.md)
- 產品決策：備註為一般 input；僅「確認更新」寫 DB；無刪除 confirm；欄位名 `note`、UI「備註」
