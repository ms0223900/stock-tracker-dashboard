import { NextResponse } from "next/server";

import { sendLineText } from "@/lib/line";

const TEST_LINE_MESSAGE =
  "【測試】stock-tracker-dashboard LINE Push 連線正常。";

const LINE_CONFIG_ERROR = "LINE 設定未完成，請檢查環境變數";
const LINE_PUSH_ERROR = "LINE Push 發送失敗，請稍後再試";
const LINE_REQUEST_ERROR = "無法連線至 LINE API，請稍後再試";

export async function POST() {
  const userId = process.env.LINE_USER_ID;

  if (!userId) {
    console.error("test-line: LINE_USER_ID is missing");
    return NextResponse.json({ error: LINE_CONFIG_ERROR }, { status: 503 });
  }

  const result = await sendLineText(userId, TEST_LINE_MESSAGE);

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  if (result.reason === "missing_env") {
    return NextResponse.json({ error: LINE_CONFIG_ERROR }, { status: 503 });
  }

  if (result.reason === "http_error") {
    return NextResponse.json(
      {
        ok: false,
        error: LINE_PUSH_ERROR,
        status: result.status,
        bodySummary: result.bodySummary,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ error: LINE_REQUEST_ERROR }, { status: 502 });
}
