const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/** LINE Push Message API 回傳非 2xx 時拋出，含 status 與 response body 摘要供除錯。 */
export class LinePushHttpError extends Error {
  readonly status: number;
  readonly bodySnippet: string;

  constructor(status: number, bodySnippet: string) {
    super(`LINE Push API 錯誤：HTTP ${status}`);
    this.name = "LinePushHttpError";
    this.status = status;
    this.bodySnippet = bodySnippet;
  }
}

/**
 * Server-side only：呼叫 LINE Messaging API 發送文字訊息。
 * 需設定環境變數 `LINE_CHANNEL_ACCESS_TOKEN`，不可暴露於前端。
 */
export async function sendLineText(to: string, text: string): Promise<void> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!channelAccessToken) {
    throw new Error(
      "LINE 尚未設定：請檢查 LINE_CHANNEL_ACCESS_TOKEN 環境變數",
    );
  }

  let res: Response;
  try {
    res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }],
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`LINE Push 連線失敗：${msg}`);
  }

  if (!res.ok) {
    const bodyText = await res.text();
    const bodySnippet =
      bodyText.length > 500 ? `${bodyText.slice(0, 500)}…` : bodyText;
    throw new LinePushHttpError(res.status, bodySnippet);
  }

  await res.json().catch(() => {});
}
