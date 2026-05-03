### US-009：部署至 Vercel 並驗收全功能

**作為** 開發者
**我想要** 將專案部署到 Vercel 並確認所有功能正常運作
**以便** 使用者可透過公開網址使用這個看板

**輸入格式**：
- 完整的 Next.js 專案原始碼
- 所有環境變數已設定於 Vercel dashboard
- Supabase 專案已對外開放連線

**輸出格式**：
- Vercel 部署成功，取得公開網址
- 所有功能可透過公開網址正常使用

**驗收條件**：
- [ ] 部署到 Vercel 後可透過公開網址存取
- [ ] 可查詢股價並顯示結果
- [ ] 可儲存追蹤項目並在刷新後仍存在
- [ ] 股價達標時 Telegram 收到通知
- [ ] API、Supabase 或 Telegram 錯誤時顯示清楚提示，應用不崩潰
- [ ] `NEXT_PUBLIC_*` 變數正確注入 frontend，secret 變數僅在 server 端可用

#### 驗收說明

**整體結論**：PARTIAL ⚠️

> 程式面具備可查詢、寫 watchlist、`/api/check-prices`／Telegram、錯誤邊界等實作，與上架所需條件大致相容；惟 US 所列驗收項皆未勾選，且公開部署、端到端達標通知與環境注入須於 Vercel／Supabase 實際驗證，本 Repo 無法靜態判斷為已完成。

---

**AC-1：[Vercel 公開網址可存取]**

狀態：🔍 需人工確認

- Repo 內為標準 Next.js App Router；是否已連結 Vercel 專案並部署成功無可從檔案確認。

---

**AC-2：[可查詢股價並顯示]**

狀態：⚠️ 部分實作

- 本機程式路徑 `useStockQuery` + `StockResultCard` + `/api/yahoo-finance` 完整。**差異說明**：需在**已部署**網址實際操作才符合 US「部署後」字面。

---

**AC-3：[可儲存追蹤、刷新仍存在]**

狀態：⚠️ 部分實作

- Client Supabase CRUD + 重新載入抓取邏輯已具備。**差異說明**：同上，需在線上環境資料庫與 `NEXT_PUBLIC_SUPABASE_*` 正確時驗證。

---

**AC-4：[達標 Telegram 收到通知]**

狀態：🔍 需人工確認

- `app/api/check-prices/route.ts`、`lib/telegram.ts` 實作通知流程；Cron 需在 Vercel 設定（文件中範例 `vercel.json`，Repo 根目錄目前無該檔）。

---

**AC-5：[API／DB／Telegram 錯誤有提示、不全站崩潰]**

狀態：⚠️ 部分實作

- 股價查詢、`saveError`、`queryError`、`symbolError` 等有 UI。**差異說明**：部份背景錯誤（如輪詢失敗、`fetchWatchlist` 回傳 null）可能僅見 console，需在線上打一輪異常情境確認。

---

**AC-6：[NEXT_PUBLIC_* 注入前端、secrets 僅 server]**

狀態：✅ 通過（架構約定）；🔍（實際 Vercel 設定需人工確認）

- `lib/supabase/client.ts` 僅讀取 `NEXT_PUBLIC_*`；`check-prices` 使用 `SUPABASE_SERVICE_ROLE_KEY`；Telegram token 於 `sendTelegramMessage` 呼叫端為 server。**差異說明**：Vercel 後台誤將 secret 加成 `NEXT_PUBLIC_` 的風險需人手檢查清單。

---

**後續建議**

- 於 Vercel 完成部署後將本 US 勾選並補連結或截註備查。
- 考慮提交範例 `vercel.json`（Cron）以降低學員遺漏排程設定。

**依賴關係**：US-001 至 US-008（所有功能完成）
**優先級**：P0
**相關功能**：spec §4 必做、§11 驗收條件
