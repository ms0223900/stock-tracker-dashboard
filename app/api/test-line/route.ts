import { NextResponse } from "next/server";
import { LinePushHttpError, sendLineText } from "@/lib/line";

export const dynamic = "force-dynamic";

const TEST_MESSAGE =
  "測試：股價投資看板已成功接上 LINE Push Message。";

export async function POST() {
  const lineUserId = process.env.LINE_USER_ID?.trim();

  if (!lineUserId) {
    return NextResponse.json(
      { ok: false, message: "缺少 LINE_USER_ID 環境變數" },
      { status: 500 },
    );
  }

  try {
    await sendLineText(lineUserId, TEST_MESSAGE);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof LinePushHttpError) {
      console.error(
        "LINE Push API error:",
        err.status,
        err.bodySnippet,
      );
      return NextResponse.json(
        {
          ok: false,
          message: err.message,
          status: err.status,
          bodySnippet: err.bodySnippet,
        },
        { status: 502 },
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("LINE test-line failed:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
