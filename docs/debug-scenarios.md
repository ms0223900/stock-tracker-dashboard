# Debug 情境模擬 — 課程教材

> 讓看不見 / 看不懂的錯誤，變成看得見的線索。

---

## 情境 A：靜默錯誤 — 空 catch 吞掉所有訊息

### 難度：⭐ ｜ 核心技能：讓錯誤出聲

### 症狀

股價都不會更新、通知都沒收到，但頁面安安靜靜——沒有錯誤訊息、沒有崩潰、沒有 loading 狀態。使用者以為一切正常，但後端其實一直在失敗。

### 現行程式碼

`hooks/useWatchlistPolling.ts` 中有**兩處**錯誤被吞掉：

**位置 1** — stockData 輪詢（line 44-51）：
```ts
try {
  const data = await fetchStockPrice(currentSymbol);
  setStockData(data);
} catch {
  // Silently ignore
}
```

**位置 2** — server-side check 觸發（line 114-117，已改為 console 版本）：
```ts
fetch("/api/check-prices").catch(() => {});
```

### Debug 流程

#### Step 1：讓錯誤現形（暴力法）

把空 catch 換成 `console.error`，讓錯誤浮出水面：

```ts
} catch (err) {
  console.error("fetchStockPrice failed:", err);
}
```

#### Step 2：觀察 browser console

1. 打開瀏覽器 DevTools → **Console** tab
2. 觸發輪詢（等待 POLL_INTERVAL_MS 或手動操作）
3. 如果看到類似以下的輸出，表示錯誤一直被吞：

```
fetchStockPrice failed: Error: Yahoo Finance 回應錯誤 (500)
```

4. 切到 **Network** tab，過濾 `yahoo-finance`
5. 點進那條 request，看 **Response** body 知道具體失敗原因

#### Step 3：追 root cause

常見原因：

| 現象 | 可能原因 |
|------|---------|
| `500` + `cannot read properties of null` | Yahoo API 回傳結構改變 |
| `429` Too Many Requests | Rate limit 被踩到 |
| `Failed to fetch` | 網路斷線 / 瀏覽器 CORS 擋掉 |
| 回應是 HTML 不是 JSON | Yahoo API endpoint 換了 |

#### Step 4：決定修復策略

不是所有錯誤都需要彈 alert 給使用者，但至少要讓開發者知道：

| 層級 | 作法 | 適用場景 |
|------|------|---------|
| **Level 1** | 空 catch → `console.error(err)` | 課程示範、快速原型 |
| **Level 2** | 依錯誤類型分流：network error 可重試、4xx 顯示提示 | 正式產品 |
| **Level 3** | 封裝統一 fetch layer + error boundary + monitoring | 成熟產品 |

### 總結教訓

> **空 catch 是最安靜的壞法。不管你決定怎麼處理錯誤，第一步永遠是：先讓錯誤出聲。**

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
| **症狀** | 完全不動，沒任何訊息 | 圖表怪怪的但不會 crash |
| **讓錯誤現形的工具** | `console.error` + Network tab | `console.log` raw API payload |
| **核心 lesson** | 空 catch 是萬惡之源 | 型別定義 ≠ 實際資料形狀 |
| **修復範圍** | 單點（1 個 catch block） | 跨 6 個 commits、4 個檔案 |
| **課程定位** | 聽不到 → 讓它出聲 | 聽不懂 → 可視化 raw data |
