export type SendTelegramResult =
  | { ok: true }
  | { ok: false; reason: string };

function getTelegramEnv(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return null;
  }

  return { token, chatId };
}

export async function sendTelegramText(
  text: string,
): Promise<SendTelegramResult> {
  const env = getTelegramEnv();

  if (!env) {
    console.error("telegram env missing: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return { ok: false, reason: "missing_env" };
  }

  const url = `https://api.telegram.org/bot${env.token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.chatId,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("telegram sendMessage failed:", response.status, body);
      return { ok: false, reason: "http_error" };
    }

    const data = (await response.json()) as { ok?: boolean };

    if (!data.ok) {
      console.error("telegram sendMessage returned ok=false:", data);
      return { ok: false, reason: "api_error" };
    }

    return { ok: true };
  } catch (error) {
    console.error("telegram sendMessage request error:", error);
    return { ok: false, reason: "request_error" };
  }
}
