# 到價通知：目標價「以上」與「以下」可分別設定

## 1. 背景與目標

主專案 [`docs/spec.md`](../../spec.md) 目前僅支援單一 `target_price`，且僅在目前股價 **大於或等於** 目標價時發送通知。

本功能讓同一筆追蹤可**分別設定**：

- **目標價以上**：目前股價 `>=` 該門檻時通知
- **目標價以下**：目前股價 `<=` 該門檻時通知

可只設其一，也可兩個都設。兩個方向**獨立觸發、獨立標記已通知**。

User Stories 見 [`user-stories/`](./user-stories/)。

---

## 2. 資料模型（定案）

沿用 `watchlist` 單列，不另建兩筆追蹤。

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `target_price` | numeric | 否（可空） | **以上**門檻；語意由「唯一目標價」改為「漲破／達標以上」 |
| `target_price_below` | numeric | 否（可空） | **以下**門檻（新增） |
| `is_notified` | boolean | 是 | **以上**方向是否已通知（沿用既有欄位） |
| `notified_at` | timestamptz | 否 | **以上**通知成功時間（沿用） |
| `is_below_notified` | boolean | 是 | **以下**方向是否已通知（新增，預設 `false`） |
| `notified_at_below` | timestamptz | 否 | **以下**通知成功時間（新增） |

### 約束（DB CHECK）

1. 至少一個門檻非空：`target_price IS NOT NULL OR target_price_below IS NOT NULL`
2. 各非空門檻須 `> 0`
3. 兩者皆設時：`target_price > target_price_below`（價格帶外通知，避免重疊語意）

### 既有資料遷移

- 既有列：`target_price` 維持原值 → 作為「以上」門檻
- `is_notified`／`notified_at` 語意對應「以上」
- `target_price_below`／`is_below_notified`／`notified_at_below` 為 null／false／null

---

## 3. 觸發與通知規則

對每一筆追蹤、每一次價格檢查：

1. 更新 `last_price`（行為與現況一致，含 ambiguous prev-close 處理）。
2. **以上**：若 `target_price` 非 null 且 `triggerPrice >= target_price` 且 `is_notified = false` → 發送通知；成功後才更新 `is_notified`、`notified_at`。
3. **以下**：若 `target_price_below` 非 null 且 `triggerPrice <= target_price_below` 且 `is_below_notified = false` → 發送通知；成功後才更新 `is_below_notified`、`notified_at_below`。
4. 門檻為 null 的方向不觸發、不改該方向通知欄位。
5. 雙設且價格介於兩門檻之間 → 兩向皆不通知。
6. 一方已通知不阻擋另一方。
7. Telegram 成功後才標記；若已設定 LINE，則 Telegram 與 LINE **皆成功**才標記（與主 spec 一致）。
8. `/api/check-prices` 與 `/api/cron/check-prices` 共用同一檢查核心。

通知文案須標示觸發方向（以上／以下），並含股票代號、目前股價、該方向目標價、觸發時間。

---

## 4. 輸入驗證（應用層）

儲存前（表單路徑必跑，與 DB CHECK 雙重防護）：

- 兩個皆空 → 錯誤
- 已填門檻須為 `> 0` 的有效數字
- 兩者皆填且以上 ≤ 以下 → 錯誤
- 僅填以上或僅填以下 → 通過

本批**不強制**新增 Server Action；現況為 client insert + DB CHECK。驗證函式集中於可重用模組（如 `lib/validation.ts`）。

---

## 5. UI 範圍

- 查價結果區：以「以上／以下」兩欄**取代**既有單一目標價輸入。
- 追蹤清單：顯示已設定門檻；未設定方向不顯示誤導值；各方向已通知狀態可辨識。

---

## 6. 非目標（本批不做）

- 編輯既有追蹤的門檻
- 重設已通知狀態以便再次通知
- 登入／多使用者隔離
- 將以上／以下拆成兩筆獨立 `watchlist` 列

---

## 7. 與主 spec 的關係

實作完成後須更新主 [`docs/spec.md`](../../spec.md) §7 資料模型、§9 更新與通知、§11 驗收條件（見 US-007）。本文件為功能定案摘要；衝突時以本批 US 驗收條件與後續合併進主 spec 的內容為準。
