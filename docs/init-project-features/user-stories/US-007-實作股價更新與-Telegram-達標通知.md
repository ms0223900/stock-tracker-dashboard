### US-007：實作股價更新與 Telegram 達標通知

**作為** 使用者
**我想要** 系統自動比對目前股價與目標股價，並在達標時透過 Telegram 通知我
**以便** 我不需要手動盯盤就能知道何時達到目標價

**輸入格式**：
- watchlist 中的所有追蹤項目
- 每筆對應的即時股價
- 環境變數：`TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`

**輸出格式**：
- `last_price` 欄位更新為最新股價
- 當 `last_price >= target_price` 且 `is_notified = false` 時：
  - 發送 Telegram 訊息（含股票代號、目前股價、目標股價、觸發時間）
  - 成功後更新 `is_notified = true`、`notified_at = 目前時間`
  - 已通知項目不重複發送
- Telegram 發送失敗時不標記為已通知

**驗收條件**：
- [x] 目前股價低於目標股價時，不發送 Telegram，`is_notified` 維持 `false`
- [x] 目前股價大於或等於目標股價時，Telegram 收到通知
- [x] 通知內容包含股票代號、目前股價、目標股價與觸發時間
- [x] 同一筆追蹤資料已通知後不會再次發送
- [x] Telegram API 失敗時 `is_notified` 不變成 `true`
- [x] `last_price` 每次檢查後正確更新

**依賴關係**：US-005（Supabase）、US-006（Yahoo Finance 模組）、US-008（追蹤清單存在）
**優先級**：P0
**相關功能**：spec §4 必做、§8 Telegram、§9 更新與通知流程

---

## 設定步驟

### 1. 建立 Telegram Bot

1. 打開 Telegram，搜尋 **@BotFather**
2. 輸入 `/newbot`，依指示建立機器人
3. BotFather 會給一組 token（格式：`1234567890:ABCdef123...`）

### 2. 取得 Chat ID

1. 對你的 Bot 傳送任意訊息（如 `/start` 或 `Hello`）
2. 在瀏覽器開啟 `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. 從 JSON 中找到 `"chat":{"id":123456789,...}`，該數字即為 Chat ID

### 3. 設定環境變數

編輯 `.env.local`，填入：

```env
TELEGRAM_BOT_TOKEN=你的機器人token
TELEGRAM_CHAT_ID=你的chat_id
```

### 4. 測試連線

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "你的chat_id",
    "text": "測試訊息"
  }'
```

或用專用測試腳本：

```bash
node scripts/test-telegram.mjs
```

### 5. 執行價格檢查

啟動 dev server 後，訪問 `/api/check-prices` 即可手動觸發完整流程（比對 watchlist 股價、更新 last_price、達標時發送 Telegram 通知）。

### 6.（選擇性）設定 Vercel Cron 自動排程

建立 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/check-prices",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

並在 Vercel Dashboard 設定 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`、`NEXT_PUBLIC_SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 環境變數。
