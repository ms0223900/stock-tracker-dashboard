const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const BODY_SUMMARY_MAX_LENGTH = 500;

export type SendLineResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_env" | "http_error" | "request_error";
      status?: number;
      bodySummary?: string;
    };

function getLineChannelAccessToken(): string | null {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return null;
  }

  return token;
}

function summarizeResponseBody(body: string): string {
  const trimmed = body.trim();

  if (trimmed.length <= BODY_SUMMARY_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, BODY_SUMMARY_MAX_LENGTH)}…`;
}

export async function sendLineText(
  to: string,
  text: string,
): Promise<SendLineResult> {
  const token = getLineChannelAccessToken();

  if (!token) {
    console.error("line env missing: LINE_CHANNEL_ACCESS_TOKEN");
    return { ok: false, reason: "missing_env" };
  }

  try {
    const response = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const bodySummary = summarizeResponseBody(body);
      console.error("line push failed:", response.status, bodySummary);
      return {
        ok: false,
        reason: "http_error",
        status: response.status,
        bodySummary,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("line push request error:", error);
    return { ok: false, reason: "request_error" };
  }
}
