import { STOCK_FETCH_ERROR } from "@/lib/constants";
import type { ChartDataPoint, StockPrice } from "@/types/stock";

const YAHOO_CHART_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart";

type YahooQuote = {
  open?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  close?: Array<number | null>;
  volume?: Array<number | null>;
};

type YahooChartResult = {
  meta?: {
    symbol?: string;
    currency?: string;
    regularMarketPrice?: number;
    regularMarketTime?: number;
    regularMarketOpen?: number;
    regularMarketVolume?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: YahooQuote[];
  };
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getValidNumbers(values: Array<number | null> | undefined): number[] {
  if (!values) {
    return [];
  }

  return values.filter(isValidNumber);
}

function getLastValidNumber(values: Array<number | null> | undefined): number | null {
  if (!values) {
    return null;
  }

  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (isValidNumber(value)) {
      return value;
    }
  }

  return null;
}

function normalizeHigh(quote: YahooQuote): number {
  const highValues = getValidNumbers(quote.high);
  if (highValues.length > 0) {
    return Math.max(...highValues);
  }

  const closeValues = getValidNumbers(quote.close);
  if (closeValues.length > 0) {
    return Math.max(...closeValues);
  }

  const lastHigh = getLastValidNumber(quote.high);
  return lastHigh ?? 0;
}

function normalizeLow(quote: YahooQuote): number {
  const lowValues = getValidNumbers(quote.low);
  if (lowValues.length > 0) {
    return Math.min(...lowValues);
  }

  const closeValues = getValidNumbers(quote.close);
  if (closeValues.length > 0) {
    return Math.min(...closeValues);
  }

  const lastLow = getLastValidNumber(quote.low);
  return lastLow ?? 0;
}

function normalizeOpen(quote: YahooQuote, meta: YahooChartResult["meta"]): number {
  if (isValidNumber(meta?.regularMarketOpen)) {
    return meta.regularMarketOpen;
  }

  const firstOpen = getValidNumbers(quote.open)[0];
  if (isValidNumber(firstOpen)) {
    return firstOpen;
  }

  const firstClose = getValidNumbers(quote.close)[0];
  return firstClose ?? 0;
}

function normalizeVolume(quote: YahooQuote, meta: YahooChartResult["meta"]): number {
  const volumeValues = getValidNumbers(quote.volume);
  if (volumeValues.length > 0) {
    return volumeValues.reduce((total, value) => total + value, 0);
  }

  if (isValidNumber(meta?.regularMarketVolume)) {
    return meta.regularMarketVolume;
  }

  const lastVolume = getLastValidNumber(quote.volume);
  return lastVolume ?? 0;
}

function normalizeChartData(
  timestamps: number[] | undefined,
  quote: YahooQuote,
): ChartDataPoint[] {
  if (!timestamps?.length || !quote.close?.length) {
    return [];
  }

  const chartData: ChartDataPoint[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const timestamp = timestamps[index];
    const close = quote.close[index];

    if (!isValidNumber(timestamp) || !isValidNumber(close)) {
      continue;
    }

    chartData.push({ timestamp, price: close });
  }

  return chartData;
}

function normalizeStockPrice(symbol: string, result: YahooChartResult): StockPrice {
  const quote = result.indicators?.quote?.[0] ?? {};
  const meta = result.meta;
  const chartData = normalizeChartData(result.timestamp, quote);

  const lastClose = getLastValidNumber(quote.close);
  const price = isValidNumber(meta?.regularMarketPrice)
    ? meta.regularMarketPrice
    : (lastClose ?? 0);

  const updateTimestamp = isValidNumber(meta?.regularMarketTime)
    ? meta.regularMarketTime * 1000
    : (chartData.at(-1)?.timestamp ?? Date.now()) * 1000;

  return {
    symbol: meta?.symbol ?? symbol,
    price,
    currency: meta?.currency ?? "TWD",
    updateTime: new Date(updateTimestamp),
    high: normalizeHigh(quote),
    low: normalizeLow(quote),
    open: normalizeOpen(quote, meta),
    volume: normalizeVolume(quote, meta),
    chartData,
  };
}

export class YahooFinanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YahooFinanceError";
  }
}

export async function fetchStockPrice(symbol: string): Promise<StockPrice> {
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=5m&range=1d`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 0 },
    });
  } catch {
    throw new YahooFinanceError(STOCK_FETCH_ERROR);
  }

  if (!response.ok) {
    throw new YahooFinanceError(STOCK_FETCH_ERROR);
  }

  let payload: { chart?: { result?: YahooChartResult[] | null; error?: unknown } };
  try {
    payload = await response.json();
  } catch {
    throw new YahooFinanceError(STOCK_FETCH_ERROR);
  }

  const result = payload.chart?.result?.[0];
  if (!result || payload.chart?.error) {
    throw new YahooFinanceError(STOCK_FETCH_ERROR);
  }

  return normalizeStockPrice(symbol, result);
}

export function serializeStockPrice(stock: StockPrice) {
  return {
    ...stock,
    updateTime: stock.updateTime.toISOString(),
  };
}

export function deserializeStockPrice(
  stock: Omit<StockPrice, "updateTime"> & { updateTime: string },
): StockPrice {
  return {
    ...stock,
    updateTime: new Date(stock.updateTime),
  };
}
