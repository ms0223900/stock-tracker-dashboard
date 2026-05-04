export function formatPrice(n: number | null): string {
  if (n === null) return "—";
  const s = n.toLocaleString("zh-TW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `NT$${s}`;
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
