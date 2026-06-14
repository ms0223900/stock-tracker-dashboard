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
  const high = maxNonNull(quote.high) ?? null;
  const low = minNonNull(quote.low) ?? null;
  const open =
    firstNonNull(quote.open) ?? firstNonNull(quote.close) ?? lastNonNull(quote.open) ?? 0;
  const volume = sumNonNull(quote.volume);
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
