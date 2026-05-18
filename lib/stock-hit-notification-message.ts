const PRICE_FMT = { minimumFractionDigits: 2 } as const;

const TITLE_PLAIN = "🚀 股價達標通知";
const TITLE_TELEGRAM_MARKDOWN = "🚀 *股價達標通知*";

export type StockHitNotificationFormat = "plain" | "telegramMarkdown";

export interface BuildStockHitNotificationOptions {
  /** 預設為送出當下 */
  triggeredAt?: Date;
  /** LINE 用 `plain`；Telegram 用 `telegramMarkdown`（標題粗體） */
  format?: StockHitNotificationFormat;
}

/**
 * 股價達標通知本文（繁中）。Telegram 與 LINE 共用：預設純文字欄位與 `telegram.ts` 原有文案一致。
 */
export function buildStockHitNotificationMessage(
  symbol: string,
  currentPrice: number,
  targetPrice: number,
  options?: BuildStockHitNotificationOptions,
): string {
  const triggeredAt = options?.triggeredAt ?? new Date();
  const format = options?.format ?? "plain";

  const timeStr = triggeredAt.toLocaleString("zh-TW", { hour12: false });
  const body = [
    TITLE_PLAIN,
    "",
    `股票代號：${symbol}`,
    `目前股價：$${currentPrice.toLocaleString("zh-TW", PRICE_FMT)}`,
    `目標股價：$${targetPrice.toLocaleString("zh-TW", PRICE_FMT)}`,
    `觸發時間：${timeStr}`,
  ].join("\n");

  if (format === "telegramMarkdown") {
    return body.replace(TITLE_PLAIN, TITLE_TELEGRAM_MARKDOWN);
  }
  return body;
}
