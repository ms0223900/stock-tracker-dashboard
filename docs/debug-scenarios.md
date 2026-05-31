# Debug 情境模擬 — 課程教材

> 讓看不見 / 看不懂的錯誤，變成看得見的線索。

---

## 情境 A：靜默錯誤 — 空 catch 吞掉所有訊息

### 難度：⭐ ｜ 核心技能：讓錯誤出聲

### 症狀

設定了目標價通知，但股價到了卻沒收到任何通知。頁面安安靜靜——沒有錯誤訊息、沒有崩潰。使用者以為通知沒設對，但其實是後端 `/api/check-prices` 一直在失敗，只是錯誤被吞掉了。

### 初始狀態（講師參考，學員不必自行閱讀）

問題出在「追蹤清單定期刷新」時會順便觸發達標檢查，但失敗時錯誤被完全忽略：

`hooks/useWatchlistPolling.ts` 中 server-side check 觸發處：

```ts
// Fire-and-forget: trigger server-side target check & Telegram notification
fetch("/api/check-prices").catch(() => {});
```

不管 `/api/check-prices` 回 401、500、timeout，全部被吃掉。開發者跟使用者一樣，完全不知道背後發生了什麼。

### Debug 流程摘要

> **一句話定位：** 錯誤被吞掉了 → 想辦法讓它「出聲」。


| 步驟         | 在做什麼                                       | 用到的工具                      |
| ---------- | ------------------------------------------ | -------------------------- |
| **Step 1** | 描述症狀，請 AI 找出「達標通知」流程哪裡把錯誤藏起來               | 給 AI 的提示詞                  |
| **Step 2** | 照 AI 建議改完後，用瀏覽器確認請求有沒有失敗                   | DevTools Console + Network |
| **Step 3** | Console 只看到「有錯」，看不到具體原因 → 請 AI 幫忙印出伺服器回傳內容 | 給 AI 的提示詞                  |
| **Step 4** | 確認 root cause，請 AI 給出完整修改建議                | 給 AI 的提示詞                  |


**Debug 節奏：** 從「完全 silence」→「知道有錯」→「知道錯在哪」→「每次呼叫都看得到成功或失敗」。

---

### Debug 流程

每個步驟都附有「給 AI 的提示詞」——直接把提示詞貼給 Claude 或其他 AI 工具，它就會幫你完成該步驟。（預設你不熟悉程式語法，不必自己改 code。）

---

#### Step 1：描述症狀，請 AI 找出錯誤被藏在哪

先確認這不是「通知沒設對」而已：


| 問題              | 你觀察到的         |
| --------------- | ------------- |
| 追蹤清單有設目標價嗎？     | 有，而且現價已經超過目標價 |
| 有收到 Telegram 嗎？ | 沒有            |
| 頁面有跳錯誤嗎？        | 沒有，一切看起來正常    |


> **🎯 給 AI 的提示詞：**
>
> ```
> 我的股票追蹤看板有設定目標價，股價已經達標了，
> 但我沒有收到 Telegram 通知，頁面上也沒有任何錯誤提示。
>
> 請幫我檢查「定期刷新追蹤清單時，順便檢查是否達標並觸發通知」這段流程，
> 看看有沒有地方請求失敗了，卻把錯誤藏起來、完全沒有顯示出來。
> 如果有，請幫我改成失敗時可以在瀏覽器開發者工具的 Console 看到錯誤訊息。
> ```

---

#### Step 2：用瀏覽器確認請求有沒有失敗

照 Step 1 的 AI 建議改完後，自己動手確認（不懂 DevTools 也可以再問 AI）：

1. 打開瀏覽器 **開發者工具**（Chrome：`F12` 或 `Cmd+Option+I`）
2. 切到 **Console** 分頁，看有沒有紅色錯誤訊息
3. 切到 **Network** 分頁，在過濾框輸入 `check-prices`
4. 等一輪追蹤清單刷新（約 60 秒），或重新整理頁面
5. 點進那條請求，看 **Response** 分頁的回傳內容

> **🎯 給 AI 的提示詞（選用，不熟悉 DevTools 時）：**
>
> ```
> 我照你的建議改完了，但我不太會用瀏覽器的開發者工具。
> 請一步一步教我怎么確認「達標檢查／發送通知」這個請求有沒有失敗，
> 以及在哪裡可以看到伺服器回傳的內容。
> ```

---

#### Step 3：Console 只看到「有錯」，看不到具體原因

Step 1、2 之後，Console 可能只顯示「請求失敗了」，但看不出**為什麼**失敗。
常見狀況：伺服器其實有回傳 `{ ok: false, error: "..." }` 的 Response，只是前端沒有把它印出來。

照 AI 建議改完後，Console 可能出現類似：

```
res { ok: false, error: "CRON_SECRET not configured" }
```

這代表後端驗證失敗（例如環境變數沒設好），但原本的空 catch 把這個訊息整口吞掉。

> **🎯 給 AI 的提示詞：**
>
> ```
> 我在 Console 看到達標檢查好像失敗了，但只看到「有錯誤」，
> 看不出伺服器具體回傳了什麼原因。
>
> 請幫我在「觸發達標檢查並發通知」的地方，
> 加上暫時的除錯方式，讓我在 Console 也能看到伺服器回傳的完整內容。
> ```

---

#### Step 4：確認 root cause，請 AI 給出修改建議

一句話總結（供講師對照，學員可直接貼給 AI）：

> 達標檢查失敗時，錯誤被「空 catch」整口吞掉，Console 完全看不到；改為印出錯誤與回傳內容後，還應區分成功／失敗，讓每次呼叫的結果一目了然。
> 目前先能夠在 Console 看到失敗原因即可，以後再來優化錯誤怎麼顯示在 UI 上。切記！ 不要一次改太多！

> **🎯 給 AI 的提示詞：**
>
> ```
> 透過剛剛的分析，問題是：達標檢查請求失敗時錯誤被完全吞掉，
> 我後來加了 log 才看到伺服器回傳的錯誤原因。
>
> 請根據這個問題，幫我提供完整的修改建議，
> 讓每次觸發達標檢查時，在 Console 都能清楚看到是成功還是失敗，
> 失敗的話也要顯示具體原因。
> ```

### 目前的版本（講師參考：依 Step 1–4 提示詞逐步改完後的結果）

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


| 層級          | 作法                                                     | 何時該用                                                |
| ----------- | ------------------------------------------------------ | --------------------------------------------------- |
| **Level 0** | `.catch(() => {})`                                     | 不應該有這個選項 ❌，當初只是為了「快速產出」而寫，實際上就算是「prototype」也應該要處理錯誤 |
| **Level 1** | `console.error` + `console.log` 裸打                     | 原型期、課程示範、快速 debug                                   |
| **Level 2** | 封裝 `fetchWithLog` wrapper，統一處理 error / success         | 正式產品                                                |
| **Level 3** | 封裝 fetch layer + error boundary + monitoring（Sentry 等） | 成熟產品                                                |


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

### Debug 流程摘要

> **一句話定位：** 資料看起來有值但「算錯了」 → 把 raw data 跟 computed 並排比對。


| 步驟         | 在做什麼                                    | 用到的工具           |
| ---------- | --------------------------------------- | --------------- |
| **Step 1** | 問三個問題縮小範圍（Y 軸範圍？開盤價對嗎？成交量對嗎？）           | 肉眼觀察            |
| **Step 2** | 加 log 同時印出「API 原始資料」和「程式算出來的值」          | `console.log`   |
| **Step 3** | 並排比對，發現 high / low / open / volume 全部算錯 | 肉眼比對 Console 輸出 |
| **Step 4** | 確認 root cause：不同欄位需要不同的聚合方式             | 請 AI 二次驗證       |


**Debug 節奏：** 從「覺得圖表怪怪的」→「看到 raw data vs computed 的落差」→「發現是聚合邏輯用錯」→「確認 root cause」。

---

### Debug 流程

每個步驟都附有「給 AI 的提示詞」——直接把提示詞貼給 Claude 或其他 AI 工具，它就會幫你完成該步驟。

---

#### Step 1：觀察症狀，縮小範圍

「折線圖怪怪的」太模糊。先問三個問題：


| 問題                 | 檢查方式                                                    |
| ------------------ | ------------------------------------------------------- |
| Y 軸範圍對嗎？           | 看折線圖的 domain：`[0, maxPrice]` 還是 `[minPrice, maxPrice]`？ |
| 開盤價是今天的還是昨天的？      | 比對 currentPrice 和 open                                  |
| 成交量是 total 還是最後一根？ | 看 volume 數字合不合理（幾百萬還是幾百？）                               |


> **🎯 給 AI 的提示詞：**
>
> ```
> 我的股票查詢頁面中，折線圖顯示的價格範圍怪怪的，低點跑到 0 附近，
> 而且開盤價看起來不對。
> 請幫我檢查「從 Yahoo 取得股價資料」這段功能，
> 看看最高價、最低價、開盤價、成交量是怎麼從 API 回傳資料算出來的。
> 我懷疑是資料處理的方式有問題。
> ```

---

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

> **🎯 給 AI 的提示詞：**
>
> ```
> 我懷疑股票報價的計算結果有問題，但我想先看看 Yahoo API
> 實際回傳的原始資料長什麼樣子，再跟我程式算出來的結果比對。
> 請幫我在「取得股價資料」的功能中，
> 加入一些暫時的除錯方式，讓我在瀏覽器的開發者工具 Console 中
> 可以看到「Yahoo 回傳的原始開盤／最高／最低／收盤／成交量資料」
> 以及「程式算出來的高、低、開盤價、成交量」以便比對除錯。
> ```

---

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


| 欄位     | Raw 中的正確值            | Computed（lastNonNull） | 錯在哪         |
| ------ | -------------------- | --------------------- | ----------- |
| high   | `151.0`（第一根）         | `150.8`（最後非 null）     | 應取最大值而非最後值  |
| low    | `149.8`（第一根）         | `149.8`（矇對）           | 應取最小值，只是碰巧對 |
| open   | `150.0`（第一根）         | `150.5`（倒數第二根）        | 應取第一根而非最後一根 |
| volume | `1000 + 2000 = 3000` | `2000`（最後非 null）      | 應加總而非取最後    |


> **🎯 給 AI 的提示詞：**
>
> ```
> 我在瀏覽器 Console 貼上我看到的輸出，請幫我看看問題在哪裡：
>
> --- 原始資料（Yahoo API 回傳）---
> open:   [150.0, null, null, 150.5, null]
> high:   [151.0, null, null, 150.5, 150.8]
> low:    [149.8, null, null, 150.1, null]
> close:  [150.0, null, null, 150.5, 150.3]
> volume: [1000, 0, 0, 2000, 0]
>
> --- 我的程式算出來的結果 ---
> high=150.8, low=149.8, open=150.5, volume=2000
>
> 我覺得怪怪的：
> - 最高價怎麼是 150.8？原始資料裡明明有 151.0
> - 開盤價怎麼是 150.5？我以為應該是第一筆 150.0
> - 成交量怎麼是 2000？如果加起來應該是 1000+2000=3000 才對
>
> 請幫我對照「取得股價資料」功能的實作，
> 告訴我為什麼算出來的值跟我想像的不一樣。
> ```

---

#### Step 4：確認 root cause，請 AI 給出修改建議

一句話總結（供講師對照，學員可直接貼給 AI）：

> 程式對所有欄位都用「取最後一個有效值」的方式處理，但最高價應取最大值、開盤價應取第一筆、成交量應加總；只有收盤價才適合用「最後一個有效值」。

> **🎯 給 AI 的提示詞：**
>
> ```
> 透過剛剛的分析，問題是：程式對所有欄位都用「取最後一個有效值」的方式處理，
> 但最高價應該取最大值、開盤價應該取第一筆、成交量應該加總才對。
>
> 請根據這個問題，幫我提供完整的修改建議。
> ```

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

> **🎯 給 AI 的提示詞：**
>
> ```
> 承上，我需要在 lib/yahoo-finance.ts 中新增幾支小工具函數，
> 用來處理「陣列裡面有 null」的狀況。我需要：
>
> 1. 過濾掉陣列中的 null，只留下有效數字
> 2. 從陣列中取出「第一筆」有效值（給開盤價用）
> 3. 從陣列中取出「最大值」（給最高價用）
> 4. 從陣列中取出「最小值」（給最低價用）
> 5. 把陣列中所有有效數字「加總」（給成交量用）
>
> 請幫我寫在 lib/yahoo-finance.ts 中，放在原本 lastNonNull 函數的附近。
> ```

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

> **🎯 給 AI 的提示詞：**
>
> ```
> 工具函數寫好之後，請幫我把 fetchStockPriceRaw 函數中
> 計算 high / low / open / volume 的這四行程式碼改掉：
>
> high   = lastNonNull(quote.high) ?? 0
> low    = lastNonNull(quote.low) ?? 0
> open   = lastNonNull(quote.open) ?? 0
> volume = lastNonNull(quote.volume) ?? 0
>
> 改成分別用剛剛建立的新函數來處理。
> 如果某個陣列全部都是 null，可以改拿 close 陣來代替當備用。
> ```

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

> **🎯 給 AI 的提示詞：**
>
> ```
> 我還發現折線圖的 chartData 在建構時，雖然已經有過濾掉 null，
> 但可以幫我 double check 一下 fetchStockPriceRaw 中
> 建立 chartData 的那段迴圈，確認 null 的處理是正確的嗎？
> 如果有遺漏，請幫我補上。
> ```

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


|               | 情境 A：靜默錯誤                       | 情境 B：資料形狀錯誤                   |
| ------------- | ------------------------------- | ----------------------------- |
| **症狀**        | 沒收到通知，但頁面正常                     | 圖表怪怪的但不會 crash                |
| **讓錯誤現形的工具**  | 給 AI 提示詞 → Console / Network 觀察 | `console.log` raw API payload |
| **核心 lesson** | 空 catch 是萬惡之源                   | 型別定義 ≠ 實際資料形狀                 |
| **修復範圍**      | 單點（達標檢查的錯誤處理）                   | 跨 6 個 commits、4 個檔案           |
| **課程定位**      | 聽不到 → 用 AI 提示詞讓它出聲              | 聽不懂 → 可視化 raw data            |


