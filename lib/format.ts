const CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number }> = {
  TWD: { symbol: "NT$", decimals: 2 },
  USD: { symbol: "$", decimals: 2 },
  HKD: { symbol: "HK$", decimals: 2 },
  JPY: { symbol: "¥", decimals: 0 },
  KRW: { symbol: "₩", decimals: 0 },
  EUR: { symbol: "€", decimals: 2 },
  GBP: { symbol: "£", decimals: 2 },
  SGD: { symbol: "S$", decimals: 2 },
};

export function formatPrice(n: number | null, currency = "TWD"): string {
  // if (n === null) return "—";
  const cfg = CURRENCY_CONFIG[currency] ?? { symbol: "TWD ", decimals: 2 };
  const s = n?.toLocaleString("zh-TW", {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  return `${cfg.symbol}${s}`;
}

/** 成交量簡寫（例：12.4M），無法計算則回傳本地化數字 */
export function formatVolumeCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toLocaleString("zh-TW");
}
