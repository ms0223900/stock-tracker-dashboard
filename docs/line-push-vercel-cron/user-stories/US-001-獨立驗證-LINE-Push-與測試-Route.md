### US-001：獨立驗證 LINE Push 與測試 Route

**作為** 開發者  
**我想要** 在未接上股價與資料庫流程前，能用後端 API 單獨送出一句 LINE 文字訊息  
**以便** 將「LINE token／userId／好友狀態」與「Yahoo／Supabase／達標邏輯」拆開除錯

**輸入格式**：
- 環境變數：`LINE_CHANNEL_ACCESS_TOKEN`、`LINE_USER_ID`（僅 server／`.env.local` 與 Vercel，**不得**使用 `NEXT_PUBLIC_*`）
- LINE Developers 已建立 Messaging API channel，且收訊端帳號已與官方帳號建立可 Push 之關係（例如加好友）
- HTTP：`POST`（或專案約定之方法）呼叫測試 Route，無須帶 body 或僅固定測試 payload

**輸出格式**：
- 新增 `lib/line.ts`（或同等命名）：`sendLineText(to: string, text: string)`（或同等 API），內部呼叫 `POST https://api.line.me/v2/bot/message/push`，`Authorization: Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`，body 含 `to`、`messages: [{ type: "text", text }]`
- 新增 Route Handler：例如 `app/api/test-line/route.ts`，成功時回傳 JSON（例如 `{ ok: true }`）；缺 env 或 LINE 非 2xx 時回傳適當 HTTP 狀態與可讀錯誤（不可空 `catch`）
- LINE API 失敗時可取得並記錄／回傳 **status** 與 **response body 摘要**（利於除錯）

**驗收條件**：
- [ ] 本機呼叫測試 Route 後，指定 `LINE_USER_ID` 之 LINE 可收到固定測試文案
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_USER_ID` 未寫死在程式碼中
- [ ] 無將 token／userId 暴露於前端 bundle 或 `NEXT_PUBLIC_*`
- [ ] LINE API 非 2xx 時有不吞錯的錯誤路徑（typed 或明確錯誤物件／訊息）

**依賴關係**：
- 無（前置為 LINE Developers 手動設定與 env 填寫）

**優先級**：P0  
**相關功能**：[`docs/line-push-vercel-cron/spec.md`](../spec.md) Story A、第三節 3.1（LINE Push 工具函式／環境變數／測試用 Route）、第七節 Story A
