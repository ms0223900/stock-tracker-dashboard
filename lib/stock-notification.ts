import { sendTelegramText } from "@/lib/telegram";

export type TargetPriceAlertPayload = {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  triggeredAt: Date;
};

export type SendTargetPriceNotificationsResult =
  | { ok: true }
  | {
      ok: false;
      reason: "no_channels" | "send_failed";
      failedChannels?: string[];
    };

export function isTelegramEnabled(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );
}

function formatTriggeredAt(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatAlertPrice(value: number): string {
  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function buildTargetPriceAlertMessage(
  payload: TargetPriceAlertPayload,
): string {
  return [
    "股價達標提醒",
    `股票：${payload.symbol}`,
    `目前股價：${formatAlertPrice(payload.currentPrice)}`,
    `目標股價：${formatAlertPrice(payload.targetPrice)}`,
    `時間：${formatTriggeredAt(payload.triggeredAt)}`,
  ].join("\n");
}

export async function sendTargetPriceNotifications(
  payload: TargetPriceAlertPayload,
): Promise<SendTargetPriceNotificationsResult> {
  const message = buildTargetPriceAlertMessage(payload);

  if (!isTelegramEnabled()) {
    console.error(
      "target notification: telegram env missing (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
    );
    return { ok: false, reason: "no_channels" };
  }

  const result = await sendTelegramText(message);

  if (!result.ok) {
    console.error("target notification failed for telegram");
    return {
      ok: false,
      reason: "send_failed",
      failedChannels: ["telegram"],
    };
  }

  return { ok: true };
}
