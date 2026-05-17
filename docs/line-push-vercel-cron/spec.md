# LINE Push 通知與 Vercel Cron — 功能規格

## 1. 背景與目標

在主專案 [`docs/spec.md`](../spec.md) 中，**LINE Messaging API** 與以 **Vercel Cron** 驅動的背景檢查皆列為 MVP 外（「先不做」或「最好有」）。本文件定義**加分／延伸功能**：在股價達標時，由伺服器透過 **LINE Push Message API** 主動通知，並可搭配 **Vercel Cron** 定時觸發檢查流程，補足「使用者未開著網頁仍能收到提醒」的情境。

**主要參考來源（LINE 流程與教學步驟）**：[Notion｜4-4 課程範例：股價達標推送 LINE 通知實作說明](https://www.notion.so/penguin-cho/4-4-LINE-54522b536882421cb59c0435cc139672)

與主 spec 對齊之重點：

- 資料模型仍以 Supabase `watchlist` 為準（`symbol`、`target_price`、`last_price`、`is_notified`、`notified_at` 等），語意與主 spec 第九節一致。
- **僅在通知發送成功後**更新 `is_notified` 與 `notified_at`；發送失敗時不得標記為已通知。
- Channel access token、LINE userId、cron 秘密皆僅能存在 **Server**／環境變數，不得暴露於 `NEXT_PUBLIC_*` 或前端 bundle。

---

## 2. 使用者故事（User Stories）

**實作優先順序（定案）**：**Story A → Story B → Story C**。先確保 LINE Push 與環境變數可獨立驗證，再接達標業務流程，最後才加上 Vercel Cron 定時觸發。

### Story A（最優先）：獨立驗證 LINE 連線

**As a** 開發者  
**I want** 在未接上完整股價流程前，能用單一 API（或同等機制）測試 LINE Push 是否成功  
**So that** 問題可分割為「LINE 設定／token／userId」與「股價與資料庫」兩塊除錯，避免一次串全程時無法定位錯誤來源。

### Story B（主功能）：伺服器主動推送 LINE 達標通知

**As a** 投資看板使用者  
**I want** 當追蹤項目達到目標價時，我能在我綁定的 LINE 收到一則文字通知  
**So that** 我不必一直開著瀏覽器也能得知達標。

### Story C：Vercel Cron 定時執行檢查

**As a** 部署在 Vercel 上的應用程式維運者  
**I want** 平台依排程呼叫指定的 API Route，執行與「檢查 watchlist + 查價 + 達標通知」相同的伺服器邏輯  
**So that** 背景環境也能定期評估是否該發送 LINE（或與既有管道協調後發送）。

---

## 3. 功能範圍

以下細項對應第二節：**Story A** 涵蓋獨立測試 Route 與底層 `sendLineText`（含環境變數）；**Story B** 涵蓋達標文案、業務流程與錯誤處理；**Story C** 見 3.2。

### 3.1 必做（本功能文件之 MVP）

| 項目 | 對應 | 說明 |
| --- | --- | --- |
| LINE Push 工具函式 | Story A／B | Server-side 呼叫 `POST https://api.line.me/v2/bot/message/push`，使用 `Authorization: Bearer {LINE_CHANNEL_ACCESS_TOKEN}`，body 含 `to`、`messages`（至少支援 `type: "text"`）。 |
| 環境變數 | Story A／B | `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_USER_ID`（課程／Demo：單一收訊者寫入 env；正式產品可再演進為多使用者綁定）。 |
| 測試用 Route | Story A | 例如 `POST /api/test-line`（路徑可依 repo 慣例調整），僅用於送出固定測試訊息以驗證 LINE 連線。 |
| 達標文案 | Story B | 與主 spec 精神一致：須包含股票代號、目前股價、目標股價與觸發時間（格式可為繁中可讀字串）。 |
| 業務流程 | Story B | 僅處理 `is_notified === false` 之資料列；`currentPrice >= target_price` 時發送 LINE；**成功後**才更新 `is_notified`、`notified_at`（並可比照現有行為更新 `last_price`／`updated_at`）。 |
| 錯誤處理 | Story B | LINE API 非 2xx 時須有 **typed 或可記錄之錯誤**（status、response body 摘要），且**不**將該筆標為已通知；不得空 `catch`。 |

### 3.2 Vercel Cron（Story C）

| 項目 | 說明 |
| --- | --- |
| 設定方式 | 於 Vercel 專案設定 Cron（例如 `vercel.json` 的 `crons` 陣列，或平台後台對應設定），`path` 指向實際存在的 Route（見下節「與現有程式對齊」）。 |
| 排程 | 由產品決定（Notion 範例為每 5 分鐘 `*/5 * * * *`）；須註明 **quota／方案限制** 以官方文件為準。 |
| 安全 | Cron 觸發之請求須可驗證身分，例如自訂 header（Notion 範例：`x-cron-secret` 比對 `CRON_SECRET`）或 Vercel 建議之 `Authorization: Bearer` 模式；**嚴禁**無驗證的公開查價 + 推播 endpoint。 |
| HTTP 方法 | Vercel Cron 預設以 **GET** 呼叫 path；若實作僅接受 POST，須改為 **GET 與 POST 共用同一 handler** 或僅暴露 GET 給 Cron（與 Notion「第 7 步」提醒一致）。 |

### 3.3 先不做（本文件刻意延後）

- 多使用者 LINE 綁定、Login channel、完整 Webhook 交換事件取得 userId（Demo 階段以 `LINE_USER_ID` 環境變數為準，與 Notion 一致）。
- LINE Flex Message、Rich Menu、LIFF。
- 複製一份獨立 `watchlist` 僅給 LINE（應共用既有表與 `is_notified` 語意）。

---

## 4. 與現有程式對齊（本 repo）

| 現況 | 本功能期望 |
| --- | --- |
| 已有 [`app/api/check-prices/route.ts`](../../app/api/check-prices/route.ts)（GET）以 Supabase + Yahoo + **Telegram** 檢查達標 | **已對齊實作**：達標分支內 Telegram 成功後，若 `LINE_CHANNEL_ACCESS_TOKEN` 與 `LINE_USER_ID` 皆設定則再送 LINE；**兩者皆成功**才更新 `is_notified`（見主 [`docs/spec.md`](../spec.md) 第八節 LINE）。 |
| 前端輪詢會呼叫 `/api/check-prices`（見 [`hooks/useWatchlistPolling.ts`](../../hooks/useWatchlistPolling.ts)） | **已定案**：Telegram 優先；LINE 為選用（依 env）；不因 Cron 另開分叉判定（US-003 仍呼叫同一路由／邏輯）。 |
| `lib/telegram.ts` 為既有通知出口 | `lib/line.ts` 負責 Push HTTP；達標文案與 Telegram 共用 [`lib/stock-hit-notification-message.ts`](../../lib/stock-hit-notification-message.ts)。 |

---

## 5. 環境變數（增量）

| 變數 | 用途 |
| --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API channel access token（僅 server）。 |
| `LINE_USER_ID` | Demo 收訊者 userId（僅 server）。 |
| `CRON_SECRET` | 驗證 Cron 或手動觸發之請求（僅 server）；不得提交版本庫。 |

本機 `.env.local` 與 Vercel 專案環境皆須設定；部署後變更 env 須重新部署始生效。

---

## 6. LINE API 重點（依 Notion／官方文件）

- **Push Message**：`POST /v2/bot/message/push`，JSON body `to` + `messages` 陣列。
- **限制**：token 僅能用在 server；使用者須曾與官方帳號建立可接收 Push 之關係（例如加好友），否則會失敗。
- **除錯**：失敗時記錄 HTTP status 與 response body；常見問題見 Notion「常見除錯」一節（token、userId、好友狀態、Vercel env、重複通知與 `is_notified`）。

---

## 7. 驗收條件（Acceptance Criteria）

建議依 **Story A → Story B → Story C** 順序驗收。

### Story A（獨立驗證）

- [ ] `POST`（或文件約定之方法）呼叫測試 Route 後，LINE 可收到測試訊息。
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_USER_ID` 未寫死在程式碼中。

### Story B（達標推送）

- [ ] 僅當 `last_price`（或伺服器本次查價結果）**大於或等於** `target_price`，且 `is_notified === false` 時，才呼叫 LINE Push。
- [ ] LINE API 成功後，`is_notified === true` 且 `notified_at` 有值；失敗時兩者不改為「已通知」狀態。
- [ ] 同一筆資料在已通知後，再次執行檢查（**含手動觸發與 Cron**）不會重複推播。

### Story C（Vercel Cron）

- [ ] Cron 設為 GET 時仍能執行檢查邏輯；無有效 secret 時回傳 401／403，不執行推播。
- [ ] 部署至 Vercel 後，Production 環境變數設定正確且行為與本機一致（允許因網路／LINE 配額造成的時間差）。

---

## 8. 與主 spec 的關係與後續文件更新

- 實作完成並決定納入產品範圍時，應更新 [`docs/spec.md`](../spec.md) 第四節「最好有／先不做」對 LINE 與 Cron 的描述，以及第十節環境變數列表。
- [`AGENTS.md`](../../AGENTS.md) 的 Current State 若有「僅前端輪詢、Cron 非前提」等敘述，若正式啟用 Cron，應同步修正避免文件互相矛盾。

---

## 9. 風險與待決問題

| 項目 | 說明 |
| --- | --- |
| Telegram 與 LINE 雙管道 | 須決定達標時是否兩者皆發、或僅其一；若皆發，需在 UX／成本上可接受。 |
| Cron 與前端輪詢競態 | 兩者可能短時間內先後觸發；依賴 DB `is_notified` 單一鎖定可避免重複推播，但仍可能「一管道成功、另一管道因已標記而跳過」— 須在實作上可接受。 |
| Vercel Cron 與方案 | 免費／付費方案對 Cron 的支援與限制以 Vercel 官方文件為準。 |
| LINE userId 取得 | Demo 用 env；正式版若要每位使用者不同收訊者，需另開需求（Webhook、綁定流程）。 |

---

## 10. 參考連結

- [Notion｜4-4 課程範例：股價達標推送 LINE 通知實作說明](https://www.notion.so/penguin-cho/4-4-LINE-54522b536882421cb59c0435cc139672)
- [LINE Messaging API — Push messages（官方）](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
- [Vercel Cron Jobs（官方）](https://vercel.com/docs/cron-jobs)
