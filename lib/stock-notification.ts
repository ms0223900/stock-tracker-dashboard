import { sendLineText } from "@/lib/line";
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

export function isLineEnabled(): boolean {
  return Boolean(
    process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_USER_ID,
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
  const tasks: Array<Promise<{ channel: string; ok: boolean }>> = [];

  if (isTelegramEnabled()) {
    tasks.push(
      sendTelegramText(message).then((result) => ({
        channel: "telegram",
        ok: result.ok,
      })),
    );
  }

  if (isLineEnabled()) {
    const userId = process.env.LINE_USER_ID!;

    tasks.push(
      sendLineText(userId, message).then((result) => ({
        channel: "line",
        ok: result.ok,
      })),
    );
  }

  if (tasks.length === 0) {
    console.error(
      "target notification: no enabled channels (telegram or line env missing)",
    );
    return { ok: false, reason: "no_channels" };
  }

  const results = await Promise.all(tasks);
  const failedChannels = results.filter((result) => !result.ok);

  if (failedChannels.length > 0) {
    console.error(
      "target notification failed for channels:",
      failedChannels.map((result) => result.channel).join(", "),
    );
    return {
      ok: false,
      reason: "send_failed",
      failedChannels: failedChannels.map((result) => result.channel),
    };
  }

  return { ok: true };
}
