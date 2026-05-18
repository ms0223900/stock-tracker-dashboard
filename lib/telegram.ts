import { buildStockHitNotificationMessage } from "@/lib/stock-hit-notification-message";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function getConfig() {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error(
      "Telegram 尚未設定：請檢查 TELEGRAM_BOT_TOKEN 與 TELEGRAM_CHAT_ID 環境變數",
    );
  }
  return { botToken: BOT_TOKEN, chatId: CHAT_ID };
}

export async function sendTelegramMessage(
  symbol: string,
  currentPrice: number,
  targetPrice: number,
): Promise<boolean> {
  const { botToken, chatId } = getConfig();

  const text = buildStockHitNotificationMessage(
    symbol,
    currentPrice,
    targetPrice,
    { format: "telegramMarkdown" },
  );

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("Telegram API error:", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Telegram send failed:", err);
    return false;
  }
}
