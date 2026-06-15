export interface ChartPoint {
  time: Date;
  price: number;
}

export interface StockPrice {
  symbol: string;
  currency: string;
  currentPrice: number;
  /** Yahoo chart `meta.regularMarketPrice` 有值時為 true；若為 false，代表 currentPrice 來自 quote.close 後備，可能等於昨收 */
  hasRegularMarketPriceFromMeta: boolean;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  open: number;
  volume: number;
  updatedAt: Date;
  chartData: ChartPoint[];
}

interface YahooChartResponse {
  chart: {
    result?: Array<{
      meta: {
        currency?: string;
        regularMarketPrice?: number;
        regularMarketTime?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

/** Yahoo 1m OHLCV：單一序列內常穿插 null，先壓成有效數字再聚合。 */
function filterNonNullNumbers(nums: (number | null)[] | undefined): number[] {
  if (!nums?.length) return [];
  return nums.filter((x): x is number => x != null);
}

function lastNonNull<T>(arr: (T | null)[]): T | undefined {
  return arr.findLast((v): v is T => v != null);
}

/** 分鐘線序列：第一個非 null（開盤／當日第一根有效報價）。 */
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

/** 當日 1 分 K：各棒成交量加總為全日量（勿取最後一根）。 */
function sumNonNull(nums: (number | null)[] | undefined): number {
  return filterNonNullNumbers(nums).reduce((a, b) => a + b, 0);
}

type YahooQuoteSeries = {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
};

/** 當日 1 分 K：開=第一根、高低=極值、量=加總。 */
function aggregateIntradayOhlcv(quote: YahooQuoteSeries): {
  open: number;
  high: number | null;
  low: number | null;
  volume: number;
} {
  return {
    open: firstNonNull(quote.open) ?? firstNonNull(quote.close) ?? 0,
    high: maxNonNull(quote.high) ?? null,
    low: minNonNull(quote.low) ?? null,
    volume: sumNonNull(quote.volume),
  };
}

/** 瀏覽器 Console：對照 Yahoo 原始 1m 序列與程式聚合結果（僅 client 端查詢時輸出）。 */
function logYahooPriceDebug(
  symbol: string,
  result: NonNullable<YahooChartResponse["chart"]["result"]>[number],
  quote: YahooQuoteSeries,
  computed: {
    currentPrice: number | undefined;
    hasRegularMarketPriceFromMeta: boolean;
    previousClose: number | null;
    high: number | null;
    low: number | null;
    open: number;
    volume: number;
  },
): void {
  if (!DEBUG_YAHOO_PRICE_IN_CONSOLE || typeof window === "undefined") return;

  const { meta } = result;
  const timestamps = result.timestamp ?? [];

  const seriesStats = (name: string, arr: (number | null)[] | undefined) => ({
    欄位: name,
    總長度: arr?.length ?? 0,
    非null筆數: arr ? filterNonNullNumbers(arr).length : 0,
    最後非null: arr ? lastNonNull(arr) : undefined,
    第一非null: arr ? firstNonNull(arr) : undefined,
  });

  const bars: Array<{
    時間: string;
    開: number | null;
    高: number | null;
    低: number | null;
    收: number | null;
    量: number | null;
  }> = [];
  const len = Math.max(
    timestamps.length,
    quote.open?.length ?? 0,
    quote.high?.length ?? 0,
    quote.low?.length ?? 0,
    quote.close?.length ?? 0,
    quote.volume?.length ?? 0,
  );
  for (let i = 0; i < len; i++) {
    const o = quote.open?.[i] ?? null;
    const h = quote.high?.[i] ?? null;
    const l = quote.low?.[i] ?? null;
    const c = quote.close?.[i] ?? null;
    const v = quote.volume?.[i] ?? null;
    if (o === null && h === null && l === null && c === null && v === null) continue;
    bars.push({
      時間: timestamps[i]
        ? new Date(timestamps[i] * 1000).toLocaleString("zh-TW", { hour12: false })
        : `#${i}`,
      開: o,
      高: h,
      低: l,
      收: c,
      量: v,
    });
  }

  const aggregatedFromSeries = {
    ...aggregateIntradayOhlcv(quote),
    closeLast: lastNonNull(quote.close) ?? null,
  };

  const label = `[股價除錯] ${symbol}`;
  console.groupCollapsed(`${label} — Yahoo 原始 vs 程式計算`);
  console.log("Yahoo meta", {
    regularMarketPrice: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    regularMarketTime: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toLocaleString("zh-TW", { hour12: false })
      : null,
    currency: meta.currency,
  });
  console.table([
    seriesStats("open", quote.open),
    seriesStats("high", quote.high),
    seriesStats("low", quote.low),
    seriesStats("close", quote.close),
    seriesStats("volume", quote.volume),
  ]);
  console.log("Yahoo 原始 OHLCV 序列（完整，含 null）", {
    timestamp: timestamps,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    close: quote.close,
    volume: quote.volume,
  });
  if (bars.length > 0) {
    console.log(`有效分 K 共 ${bars.length} 根（展開下方 table 檢視）`);
    console.table(bars);
  }
  console.log("程式算出（日內 1m 聚合：開=第一根、高低=極值、量=加總）", {
    currentPrice: computed.currentPrice,
    hasRegularMarketPriceFromMeta: computed.hasRegularMarketPriceFromMeta,
    previousClose: computed.previousClose,
    open: computed.open,
    high: computed.high,
    low: computed.low,
    volume: computed.volume,
    closeLast: aggregatedFromSeries.closeLast,
  });
  console.groupEnd();
}

/** TODO(prototype): 除錯完成後改為 false 或移除此區塊 */
const DEBUG_YAHOO_PRICE_IN_CONSOLE = true;

export const PRICE_EQ_EPS = 0.01;

export function approxEqualPrices(a: number, b: number): boolean {
  return Math.abs(a - b) < PRICE_EQ_EPS;
}

/** 相對昨收漲跌（台股紅漲綠跌）；無昨收或現價時視為 neutral。 */
export type TwseMovement = "up" | "down" | "neutral";

export function getTwseMovement(
  last: number | null,
  previousClose: number | null,
): TwseMovement {
  if (last === null || previousClose === null) return "neutral";
  if (approxEqualPrices(last, previousClose)) return "neutral";
  if (last > previousClose) return "up";
  return "down";
}

/** Yahoo 未給 regularMarketPrice、後備價又貼近昨收時，視為不可靠快照（勿覆寫較可信的 last_price）。 */
export function isAmbiguousPrevCloseSnapshot(p: {
  hasRegularMarketPriceFromMeta: boolean;
  currentPrice: number;
  previousClose: number | null;
}): boolean {
  return (
    !p.hasRegularMarketPriceFromMeta &&
    p.previousClose != null &&
    approxEqualPrices(p.currentPrice, p.previousClose)
  );
}

export async function fetchStockPrice(symbol: string): Promise<StockPrice> {
  return fetchStockPriceRaw(symbol, `/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}`);
}

/** Server-side version: calls Yahoo Finance directly (no CORS restriction). */
export async function fetchStockPriceServer(symbol: string): Promise<StockPrice> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  return fetchStockPriceRaw(symbol, url);
}

async function fetchStockPriceRaw(symbol: string, url: string): Promise<StockPrice> {

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error("無法連線到伺服器，請檢查網路連線");
  }

  if (!response.ok) {
    throw new Error(`Yahoo Finance 回應錯誤 (${response.status})`);
  }

  const json: YahooChartResponse = await response.json();

  if (json.chart?.error) {
    throw new Error(
      `股票代號「${symbol}」無效或無法取得資料：${json.chart.error.description}`,
    );
  }

  const result = json.chart.result?.[0];
  if (!result) {
    throw new Error(`股票代號「${symbol}」無效或無法取得資料`);
  }

  const quote = result.indicators.quote[0];
  const currency = result.meta.currency ?? "TWD";
  const metaRegularMarketPrice = result.meta.regularMarketPrice;
  const hasRegularMarketPriceFromMeta = metaRegularMarketPrice != null;
  const fallbackClose = lastNonNull(quote.close);
  const currentPrice = metaRegularMarketPrice ?? fallbackClose;
  const previousClose = result.meta.previousClose ?? null;
  let change: number | null = null;
  let changePercent: number | null = null;
  if (previousClose !== null && currentPrice != null) {
    change = currentPrice - previousClose;
    changePercent = previousClose !== 0 ? (change / previousClose) * 100 : null;
  }
  const { open, high, low, volume } = aggregateIntradayOhlcv(quote);

  logYahooPriceDebug(symbol, result, quote, {
    currentPrice,
    hasRegularMarketPriceFromMeta,
    previousClose,
    high,
    low,
    open,
    volume,
  });

  const updatedAt = result.meta.regularMarketTime
    ? new Date(result.meta.regularMarketTime * 1000)
    : new Date();

  if (currentPrice === undefined || currentPrice === null) {
    throw new Error(`無法解析股票代號「${symbol}」的股價資料`);
  }

  // Build chart data from timestamp + close pairs
  const chartData: ChartPoint[] = [];
  if (result.timestamp && quote.close) {
    for (let i = 0; i < result.timestamp.length; i++) {
      const price = quote.close[i];
      if (price !== null) {
        chartData.push({
          time: new Date(result.timestamp[i] * 1000),
          price,
        });
      }
    }
  }

  return {
    symbol,
    currency,
    currentPrice,
    hasRegularMarketPriceFromMeta,
    previousClose,
    change,
    changePercent,
    high,
    low,
    open,
    volume,
    updatedAt,
    chartData,
  };
}
