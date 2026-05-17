/**
 * 股價達標 LINE 文字訊息（繁中），語意對齊主 spec Telegram／LINE 範例。
 */
export function buildStockHitLineMessage(
  symbol: string,
  currentPrice: number,
  targetPrice: number,
): string {
  const priceFmt = { minimumFractionDigits: 2 } as const;
  const timeStr = new Date().toLocaleString("zh-TW", { hour12: false });
  return [
    "股價達標提醒",
    "",
    `股票：${symbol}`,
    `目前股價：$${currentPrice.toLocaleString("zh-TW", priceFmt)}`,
    `目標股價：$${targetPrice.toLocaleString("zh-TW", priceFmt)}`,
    `時間：${timeStr}`,
  ].join("\n");
}
