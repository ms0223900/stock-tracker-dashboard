# 雙向到價通知 — 功能規格

## 1. 背景與目標

主專案 [`docs/spec.md`](../spec.md) 現僅支援「目前股價 **大於或等於** 目標價」時發送 Telegram（及選用 LINE）通知，並以單一 `is_notified` 標記避免重複。

本功能擴充為：使用者可**分別設定**是否在「價格 **以上**（≥ 目標價）」與「價格 **以下**（≤ 目標價）」觸發通知；兩方向**獨立開關**、**獨立通知狀態**，各方向至多通知一次。

## 2. 與現況差異

| 項目 | 現況 | 本功能 |
| --- | --- | --- |
| 觸發條件 | `price >= target_price` | 依 `notify_above`／`notify_below` 分別判定 ≥ 或 ≤ |
| 通知狀態 | `is_notified`、`notified_at` | `is_notified_above`／`below` 與對應 `notified_at_*` |
| UI 設定 | 僅目標價 | 目標價 + 兩個方向開關 |
| 通知文案 | 「股價達標通知」 | 區分「向上突破目標價」「向下跌破目標價」 |

## 3. 產品規則

### 3.1 觸發條件

- **向上突破（above）**：`notify_above === true` 且 `triggerPrice >= target_price` 且 `is_notified_above === false`
- **向下跌破（below）**：`notify_below === true` 且 `triggerPrice <= target_price` 且 `is_notified_below === false`
- `triggerPrice` 語意與既有 `runWatchlistPriceCheck` 一致（含 `isAmbiguousPrevCloseSnapshot` 時沿用 DB `last_price`）
- 兩方向**獨立**判定；同一輪查價若兩條件皆成立（例如 `price === target_price` 且雙向皆啟用），可各嘗試發送一則通知，各自更新對應狀態欄位

### 3.2 儲存驗證

- `target_price` 仍須 > 0（沿用既有驗證）
- **至少啟用一個方向**：`notify_above || notify_below` 須為 true
- 全關時顯示繁中錯誤「請至少選擇一種通知方向」，**不寫入 DB**
- 應用層驗證為必須；DB 可選加 `CHECK (notify_above OR notify_below)`（migration 一併實作）

### 3.3 預設值（向後相容）

| 欄位 | 新列預設 | 說明 |
| --- | --- | --- |
| `notify_above` | `true` | 與現有 MVP「僅向上突破」一致 |
| `notify_below` | `false` | 新能力預設關閉 |
| `is_notified_above` | `false` | |
| `is_notified_below` | `false` | |

**既有資料遷移**：

- `notify_above = true`，`notify_below = false`
- 若舊 `is_notified = true` → `is_notified_above = true`，`notified_at_above = notified_at`
- 移除 `is_notified`、`notified_at`

### 3.4 通知通道

- 規則與主 spec 第八節一致：**每方向**須 Telegram 成功；若設定 LINE 則兩通道皆成功後，才更新**該方向**的 `is_notified_*`／`notified_at_*`
- 一方向發送失敗不影響另一方向已成功的標記

### 3.5 通知文案（繁中）

| 方向 | 標題範例 |
| --- | --- |
| above | 🚀 向上突破目標價 |
| below | 📉 向下跌破目標價 |

內文仍含：股票代號、目前股價、目標股價、觸發時間。

### 3.6 MVP 範圍外

- **不**實作編輯既有追蹤項目的通知開關（要改需刪除後重新新增）
- **不**新增第二個目標價欄位（以上／以下共用 `target_price`）
- **不**變更 60 秒輪詢間隔與 Cron 排程

## 4. 資料模型（`watchlist` 變更）

### 新增欄位

| 欄位 | 型別 | 必填 | 預設 | 說明 |
| --- | --- | --- | --- | --- |
| `notify_above` | boolean | 是 | `true` | 啟用「價格 ≥ 目標價」通知 |
| `notify_below` | boolean | 是 | `false` | 啟用「價格 ≤ 目標價」通知 |
| `is_notified_above` | boolean | 是 | `false` | 向上突破是否已通知 |
| `is_notified_below` | boolean | 是 | `false` | 向下跌破是否已通知 |
| `notified_at_above` | timestamptz | 否 | — | 向上突破通知成功時間 |
| `notified_at_below` | timestamptz | 否 | — | 向下跌破通知成功時間 |

### 移除欄位

- `is_notified`
- `notified_at`

### 約束

- `CHECK (notify_above OR notify_below)`

## 5. 受影響模組

| 路徑 | 變更摘要 |
| --- | --- |
| `supabase/migrations/` | 新增 migration |
| `types/watchlist.ts` | 型別更新 |
| `lib/run-watchlist-price-check.ts` | 雙向判定與獨立狀態更新 |
| `lib/stock-hit-notification-message.ts` | 方向化文案 |
| `lib/telegram.ts` | 傳入方向參數 |
| `lib/validation.ts` | `validateNotifyDirections` |
| `hooks/useWatchlist.ts` | insert 新欄位 |
| `components/StockResultCard.tsx` | 雙向開關 UI |
| `components/WatchlistCard.tsx` | 方向與狀態顯示 |
| `components/QueryAndTrackCard.tsx` | 說明文字 |
| `docs/spec.md` | 主規格同步（US-006） |

## 6. 驗收情境（摘要）

1. 僅勾「以上」：行為與現有 MVP 相同
2. 僅勾「以下」：`price <= target` 時通知，向上突破不通知
3. 雙向皆勾：兩方向各自觸發一次；一方向已通知不阻擋另一方向
4. 兩者皆未勾：儲存失敗、不寫 DB
5. `price === target` 且雙開：同一輪可各發一則（標題方向不同）
6. Telegram／LINE 失敗：該方向 `is_notified_*` 維持 false
