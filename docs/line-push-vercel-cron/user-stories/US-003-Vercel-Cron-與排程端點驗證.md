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

**驗收條件**：
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
