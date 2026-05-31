# Debug 情境模擬 — 課程教材

> 讓看不見 / 看不懂的錯誤，變成看得見的線索。

---

## 情境 A：靜默錯誤 — 空 catch 吞掉所有訊息

### 難度：⭐ ｜ 核心技能：讓錯誤出聲

### 症狀

設定了目標價通知，但股價到了卻沒收到任何通知。頁面安安靜靜——沒有錯誤訊息、沒有崩潰。使用者以為通知沒設對，但其實是後端 `/api/check-prices` 一直在失敗，只是錯誤被吞掉了。

### 初始狀態（空 catch）

`hooks/useWatchlistPolling.ts` 中 server-side check 觸發處：

```ts
// Fire-and-forget: trigger server-side target check & Telegram notification
fetch("/api/check-prices").catch(() => {});
```

不管 `/api/check-prices` 回 401、500、timeout，全部被吃掉。開發者跟使用者一樣，完全不知道背後發生了什麼。

### Debug 流程

#### Step 1：讓錯誤現形（暴力法）

把空 catch 換成 `console.error`，讓錯誤浮出水面：

```ts
fetch("/api/check-prices").catch((err) => {
  console.error("Failed to trigger server-side target check & Telegram notification", err);
});
```

#### Step 2：觀察 browser console 與 Network tab

1. 打開瀏覽器 DevTools → **Console** tab
2. 觸發輪詢（等待 POLL_INTERVAL_MS 或手動操作）
3. 切到 **Network** tab，過濾 `check-prices`
4. 點進那條 request，看 **Response** body 知道具體失敗原因

#### Step 3：再加一層，觀察 response body

錯誤訊息說明了「有錯誤」，但我們在 Console 中看不到，因此看不到具體原因。請 AI 幫我們調整程式碼：「Console 中也能看到錯誤訊息」

```ts
const res = await fetch("/api/check-prices").catch((err) => {
  console.error("Failed to trigger server-side target check & Telegram notification", err);
}).then((res) => res?.json());

console.log("res", res);
```

現在 Console 會出現類似輸出：

```
res { ok: false, error: "CRON_SECRET not configured" }
```

原來是 `CRON_SECRET` 環境變數沒設，API route 驗證失敗回傳了錯誤，但原本的空 catch 把這個訊息整口吞掉。

#### Step 4：區分成功與失敗，各自 log

加上成功/失敗分流，讓每次呼叫的結果一目瞭然：

```ts
if (res && res.ok) {
  console.log("Server-side target check & Telegram notification triggered successfully");
} else {
  console.error("Failed to trigger server-side target check & Telegram notification: ", res?.error);
}
```

### 目前的版本（你在專案中的作法）

以上步驟全部串起來後，專案中目前的程式碼長這樣（`hooks/useWatchlistPolling.ts` line 115）：

```ts
// Fire-and-forget: trigger server-side target check & Telegram notification
const res = await fetch("/api/check-prices").catch((err) => {
  console.error(
    "Failed to trigger server-side target check & Telegram notification",
    err,
  );
  // TODO: add error handling for production mode
}).then((res) => res?.json());

console.log("res", res);

if (res && res.ok) {
  console.log(
    "Server-side target check & Telegram notification triggered successfully",
  );
} else {
  console.error(
    "Failed to trigger server-side target check & Telegram notification: ",
    res?.error,
  );
}
```

雖然不算優雅（沒有封裝、直接用 `console.log` / `console.error` 裸打），但：
- **直覺易懂** — 任何開發者看一眼就知道它在做什麼
- **立刻可視** — 打開 Console 就看到成功/失敗全貌
- **容易複製** — 新手也能照著寫

### 三個層級的演化

| 層級 | 作法 | 何時該用 |
|------|------|---------|
| **Level 0** | `.catch(() => {})` | 不應該有這個選項 ❌，當初只是為了「快速產出」而寫，實際上就算是「prototype」也應該要處理錯誤 |
| **Level 1** | `console.error` + `console.log` 裸打 | 原型期、課程示範、快速 debug |
| **Level 2** | 封裝 `fetchWithLog` wrapper，統一處理 error / success | 正式產品 |
| **Level 3** | 封裝 fetch layer + error boundary + monitoring（Sentry 等） | 成熟產品 |

### 總結教訓

> **空 catch 是最安靜的壞法。不管你決定怎麼處理錯誤，第一步永遠是：先讓錯誤出聲。**
> Console 是你的朋友，`console.log` / `console.error` 雖然樸素，但在你還沒建立完整 error handling 架構前，已經能解決 80% 的問題。

---

## 情境 B：資料形狀不對 — OHLC null 值讓折線圖壞掉

### 難度：⭐⭐ ｜ 核心技能：用 console.log 讓 invisible data 現形

### 症狀

- 查詢正常股票（如 2330.TW），折線圖外觀 OK
- 查詢冷門股或盤後時段 → 折線圖 Y 軸怪怪的，高點偏低、低點跑到 0
- 沒有 error、沒有 crash，就是圖表「看起來不太對」

### 真實背景

Yahoo Finance API 回傳的 1 分鐘 OHLCV 陣列中大量穿插 `null`：

```ts
// Yahoo chart API 回傳的 raw quote 結構
indicators: {
  quote: [{
    open:  [150.0, null, null, 150.5, null, ...],  // 大量 null
    high:  [150.2, null, null, 151.0, null, ...],
    low:   [149.8, null, null, 150.1, null, ...],
    close: [150.0, null, null, 150.5, 150.3, ...],
    volume: [1000, 0, 0, 2000, 0, ...],
  }]
}
```

原始程式碼只用 `lastNonNull` 來處理所有欄位：

```ts
const high = lastNonNull(quote.high) ?? 0;    // ← 只取最後非 null
const low = lastNonNull(quote.low) ?? 0;
const open = lastNonNull(quote.open) ?? 0;
const volume = lastNonNull(quote.volume) ?? 0;
```

### Debug 流程

#### Step 1：觀察症狀，縮小範圍

「折線圖怪怪的」太模糊。先問三個問題：

| 問題 | 檢查方式 |
|------|---------|
| Y 軸範圍對嗎？ | 看折線圖的 domain：`[0, maxPrice]` 還是 `[minPrice, maxPrice]`？ |
| 開盤價是今天的還是昨天的？ | 比對 currentPrice 和 open |
| 成交量是 total 還是最後一根？ | 看 volume 數字合不合理（幾百萬還是幾百？） |

#### Step 2：讓錯誤現形 — dump raw API payload

在 `fetchStockPriceRaw` 中，Yahoo API response parse 完成後加一行：

```ts
console.log("RAW quote.OHLC:", {
  open: quote.open,
  high: quote.high,
  low: quote.low,
  close: quote.close,
  volume: quote.volume,
});
console.log("COMPUTED:", { high, low, open, volume });
```

#### Step 3：比對 raw data vs computed

在 Console 中比對兩行輸出：

```
RAW quote.OHLC: {
  open:  [150.0, null, null, 150.5, null],
  high:  [151.0, null, null, 150.5, 150.8],
  low:   [149.8, null, null, 150.1, null],
  close: [150.0, null, null, 150.5, 150.3],
  volume: [1000, 0, 0, 2000, 0]
}

COMPUTED: { high: 150.8, low: 149.8, open: 150.5, volume: 2000 }
```

發現問題：

| 欄位 | Raw 中的正確值 | Computed（lastNonNull） | 錯在哪 |
|------|---------------|------------------------|--------|
| high | `151.0`（第一根） | `150.8`（最後非 null） | 應取最大值而非最後值 |
| low | `149.8`（第一根） | `149.8`（矇對） | 應取最小值，只是碰巧對 |
| open | `150.0`（第一根） | `150.5`（倒數第二根） | 應取第一根而非最後一根 |
| volume | `1000 + 2000 = 3000` | `2000`（最後非 null） | 應加總而非取最後 |

#### Step 4：確認 root cause

一句話總結：

> **`lastNonNull`（取最後非 null 值）只對 close 是正確的，對 high / low / open / volume 都是錯的聚合邏輯。**

各欄位需要的聚合方式完全不同：

| 欄位 | 正確含義 | 需要的聚合 |
|------|---------|-----------|
| `open` | 開盤價 | **第一根**有效值 → `firstNonNull` |
| `high` | 全日最高價 | **最大值** → `maxNonNull` |
| `low` | 全日最低價 | **最小值** → `minNonNull` |
| `volume` | 全日成交量 | **加總** → `sumNonNull` |
| `close` | 最後成交價 | **最後一根**有效值 → `lastNonNull` ✅ |

### 解法

#### 建立四種 null-safe 聚合函數

在 `lib/yahoo-finance.ts` 加入：

```ts
function filterNonNullNumbers(nums: (number | null)[] | undefined): number[] {
  if (!nums?.length) return [];
  return nums.filter((x): x is number => x != null);
}

function firstNonNull<T>(arr: (T | null)[] | undefined): T | undefined {
  return arr?.find((v): v is T => v != null);
}

function maxNonNull(nums: (number | null)[] | undefined): number | undefined {
  const valid = filterNonNullNumbers(nums);
  return valid.length ? Math.max(...valid) : undefined;
}

function minNonNull(nums: (number | null)[] | undefined): number | undefined {
  const valid = filterNonNullNumbers(nums);
  return valid.length ? Math.min(...valid) : undefined;
}

function sumNonNull(nums: (number | null)[] | undefined): number {
  return filterNonNullNumbers(nums).reduce((a, b) => a + b, 0);
}
```

#### 改寫 OHLC parse 邏輯

```ts
const high =
  maxNonNull(quote.high) ?? maxNonNull(quote.close) ?? lastNonNull(quote.high) ?? 0;
const low =
  minNonNull(quote.low) ?? minNonNull(quote.close) ?? lastNonNull(quote.low) ?? 0;
const open =
  firstNonNull(quote.open) ?? firstNonNull(quote.close) ?? lastNonNull(quote.open) ?? 0;
const volume = sumNonNull(quote.volume);
```

> 注意 fallback 鏈：先嘗試對應的聚合，若全為 null 則試 close 陣列的同一聚合，最後才用 `?? 0` 兜底。

#### ChartData 也一併過濾

```ts
// 原本：直接把所有 close 推入 chartData（包含 null）
for (let i = 0; i < result.timestamp.length; i++) {
  const price = quote.close[i];
  // 加上 null 過濾
  if (price !== null) {
    chartData.push({
      time: new Date(result.timestamp[i] * 1000),
      price,
    });
  }
}
```

### 真實 commit 鏈

這個 bug 的修復花了 6 個 commits 才完整：

```
b3b2c4f 加入 firstNonNull、maxNonNull、minNonNull、sumNonNull
   ↓        發現問題，建立工具函數
cb0b832  Refactor 這組函數，簡化實作
   ↓
9d8f5be  再 refactor，抽 filterNonNullNumbers 消除重複
   ↓
d2fe8c3  更新 spec，寫明 OHLC 資料規範（文件對齊）
   ↓
721c4a2  加入 getTwseMovement()，統一漲跌判斷邏輯
   ↓
6971986  抽 lib/twse-display.ts，統一顏色/圖示邏輯
```

### 總結教訓

> **型別定義不等於實際資料形狀。**  
> Yahoo API 說 `number[]`，但實際上裡面充滿了 `null`。  
> 前端工程的關鍵能力之一：**在邊界點 dump raw data，不要相信型別定義是護身符。**

---

## 附錄：兩者對照表

| | 情境 A：靜默錯誤 | 情境 B：資料形狀錯誤 |
|--|-----------------|-------------------|
| **症狀** | 沒收到通知，但頁面正常 | 圖表怪怪的但不會 crash |
| **讓錯誤現形的工具** | `console.error` + `console.log` 裸打 | `console.log` raw API payload |
| **核心 lesson** | 空 catch 是萬惡之源 | 型別定義 ≠ 實際資料形狀 |
| **修復範圍** | 單點（1 個 catch → log） | 跨 6 個 commits、4 個檔案 |
| **課程定位** | 聽不到 → 讓它出聲 | 聽不懂 → 可視化 raw data |
