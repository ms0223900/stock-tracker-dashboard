### US-003：Vercel Cron 與排程端點驗證

**作為** 將應用程式部署在 Vercel 的維運者  
**我想要** 由平台依排程呼叫檢查 API，執行與「watchlist 查價 + 達標通知」相同的伺服器邏輯  
**以便** 使用者未開網頁時仍能定期評估是否發送 LINE（及／或既有 Telegram，視 US-002 之產品決策）

**輸入格式**：
- Vercel 專案：`vercel.json`（或平台後台）設定 `crons`，`path` 須為 **`/api/cron/check-prices`**（見 repo 根目錄範例）；`schedule` 須符合帳戶方案。**Vercel Hobby（重要）**：官方限制 Cron **每天只能執行一次**；若表達式會更頻繁觸發，**部署階段即會失敗**——`Hobby accounts are limited to cron jobs that run once per day. Cron expressions that would run more frequently will fail during deployment.`（詳見主 [`docs/spec.md`](../../spec.md) 第十節）。
- 環境變數：`CRON_SECRET`（僅 server）；手動或 Cron 觸發時須帶驗證 header（例如 `x-cron-secret` 或官方建議之 `Authorization: Bearer`），與 [`docs/line-push-vercel-cron/spec.md`](../spec.md) 第五節環境變數一致
- **US-002** 已完成：檢查流程含 LINE（及／或 Telegram）且達標與 DB 更新正確

**輸出格式**：
- Cron 使用 **GET** 呼叫時仍能執行完整檢查（與功能 spec 第三節 3.2 一致）；若目前 Route **僅接受 POST**，則須改為 **GET 與 POST 共用同一 handler**，並於該 handler 內驗證 `CRON_SECRET`（或同等機制）
- 無有效 secret 時回傳 **401／403**，**不**執行查價與推播
- Production 部署後 Cron 或手動帶 secret 之請求可成功跑完；失敗時可於 Vercel Logs 追蹤

**驗收條件（簡化說法）**：

- 有一支 **Cron 專用** Route（例如 **`GET /api/cron/check-prices`**）；**沒帶對的 `CRON_SECRET` 就只做 401，不查價、不推播**。
- 帶對 secret 時：**讀追蹤清單 → 查目前股價 → 比對是否達標**（與 **`/api/check-prices`** 同一套伺服器邏輯）。
- **達標時**沿用既有 **Telegram／LINE** 通知規則（見 **US-002**）。
- **通知判定成功後**，才把 **`is_notified`／`notified_at`** 寫成已通知；失敗則維持未通知。
- **回傳 JSON 初學者可讀**：至少含摘要 **`message`** 與逐筆說明 **`results`**（每檔一行體感結果；總檢查筆數可對 **`results.length`**；細節見完整驗收與實作 [`lib/run-watchlist-price-check.ts`](../../../lib/run-watchlist-price-check.ts)）。
- **Vercel Cron**（`vercel.json` 或後台）的 path **指到這支 Route**，且排程須 **GET**；**Hobby** 方案 **每日最多一次 Cron**，過頻會 **deploy 失敗**。
- **Production** 上環境變數（**`CRON_SECRET`**、**`LINE_*`** 等）設定正確且與本機驗證一致（需實際部署後自行確認）。

**驗收條件（完整）**：

- [x] Repo 內須有對應 **`GET /api/cron/check-prices`** 之 App Router 實作（本 repo 為 [`app/api/cron/check-prices/route.ts`](../../../app/api/cron/check-prices/route.ts)）；進入點需驗證 `CRON_SECRET`（或同等機制）後，查價與達標通知須與 **`/api/check-prices`** 共用同一套伺服器邏輯（本 repo 為 [`lib/run-watchlist-price-check.ts`](../../../lib/run-watchlist-price-check.ts)），禁止另起一套分叉流程。
- [x] 以有效 secret **手動或 Cron 觸發**時，會讀取 watchlist、查詢股價、依目標價判定達標與否，並依判定呼叫／略過通知（語意與 [`app/api/check-prices/route.ts`](../../../app/api/check-prices/route.ts) 一致）。
- [x] 達標時沿用 **US-002**：通知管道與「**Telegram 優先、LINE 為選配時須兩者皆成功才標記已通知**」等規則與主 [`docs/spec.md`](../../spec.md) 一致。
- [x] **`is_notified`／`notified_at`** 僅在通知流程**判定成功**後更新；發送失敗或未達標時不誤標為已通知。
- [x] 成功時回應 JSON 含可讀 **`message`** 與逐筆 **`results`**（本 repo 為英文明細字串陣列；Cron Route 另含 **`source: "cron"`** 便於辨識）；初學者可從內容看出每檔是否略過、已通知、達標但送失敗等（尚**無**獨立 `checkedCount`／`notifySuccessCount` 欄位時，以 `results` 筆數與內容理解即可）。
- [x] `crons` 設定之 path 與 repo 內 Route 路徑一致，且該 Route 支援 **GET**（符合 Vercel Cron 預設行為）
- [x] 缺少或錯誤的 cron secret 無法觸發查價／通知邏輯
- [ ] 部署至 Vercel Production 後，環境變數（含 `CRON_SECRET`、`LINE_*`）設定正確且行為與本機驗證一致（允許網路／配額造成之時間差）（**請於 Vercel 設定 env 並部署後自行驗證**）
- [x] **Hobby 部署相容**：若目標環境為 Vercel Hobby，`schedule` 不得早於「每日一次」，否則依官方行為會 **deploy 失敗**（見輸入格式之英文原文）

**手動驗證範例**（本機需 `CRON_SECRET` 已寫入 `.env.local`）：

```bash
curl -sS "http://localhost:3000/api/cron/check-prices" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# 或
curl -sS "http://localhost:3000/api/cron/check-prices" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

**依賴關係**：
- **US-002**（檢查與 LINE 整合須先正確）
- Vercel 帳號與方案須支援 Cron；**Hobby** 僅允許每日一次 Cron，過頻表達式會於部署失敗（見主 spec 第十節）

**優先級**：P1  
**相關功能**：[`docs/line-push-vercel-cron/spec.md`](../spec.md) Story C、第三節 3.2、第七節 Story C
