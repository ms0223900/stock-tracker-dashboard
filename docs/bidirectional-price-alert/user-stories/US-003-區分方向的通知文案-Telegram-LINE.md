### US-003：區分方向的通知文案（Telegram／LINE）

**作為** 使用者
**我想要** 收到明確標示「向上突破」或「向下跌破」的通知內容
**以便** 能分辨是哪一種到價條件觸發

> **交付約束**：本 US 必須與 **US-002** 同一 PR／同一波次交付。

**輸入格式**：
- 股票代號、目前股價、目標價、觸發方向（`above` | `below`）、觸發時間
- 既有 [`lib/stock-hit-notification-message.ts`](../../../lib/stock-hit-notification-message.ts)、[`lib/telegram.ts`](../../../lib/telegram.ts)、`sendLineText`

**輸出格式**：
- `buildStockHitNotificationMessage` 新增 `direction: 'above' | 'below'` 參數
- `sendTelegramMessage` 簽章同步接受方向並傳入建構函式
- 通知標題／內文（繁中）：
  - **above**：`🚀 向上突破目標價`（Telegram Markdown 標題可加粗）
  - **below**：`📉 向下跌破目標價`
- 內文仍含：股票代號、目前股價、目標股價、觸發時間
- LINE 純文字與 Telegram 共用建構函式

**驗收條件**：
- [ ] above 與 below 標題可明確區分，且仍含代號、目前價、目標價、時間
- [ ] `sendTelegramMessage` 與 LINE 呼叫路徑皆傳入正確 `direction`
- [ ] Telegram 與 LINE 文案結構一致（僅格式差異如 Markdown）
- [ ] 未設定 LINE 時僅 Telegram 的流程不受影響
- [ ] `price === target` 且雙向同輪觸發時，兩則通知標題方向不同

**依賴關係**：
- US-001
- US-002（同波次強制一併交付）

**優先級**：P0
**相關功能**：通知內容、第八節 Telegram/LINE
