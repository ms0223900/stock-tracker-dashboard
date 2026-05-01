export interface ChartPoint {
  time: Date;
  price: number;
}

export interface StockPrice {
  symbol: string;
  currentPrice: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  updatedAt: Date;
  chartData: ChartPoint[];
}

interface YahooChartResponse {
  chart: {
    result?: Array<{
      meta: {
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

function lastNonNull<T>(arr: (T | null)[]): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null) return arr[i] as T;
  }
  return undefined;
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
    response = await fetch(url);
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
  const currentPrice = result.meta.regularMarketPrice ?? lastNonNull(quote.close);
  const high = lastNonNull(quote.high) ?? 0;
  const low = lastNonNull(quote.low) ?? 0;
  const open = lastNonNull(quote.open) ?? 0;
  const volume = lastNonNull(quote.volume) ?? 0;
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
    currentPrice,
    high,
    low,
    open,
    volume,
    updatedAt,
    chartData,
  };
}
