import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runWatchlistPriceCheck } from "@/lib/run-watchlist-price-check";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWatchlistPriceCheck();

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        ...(result.detail !== undefined ? { detail: result.detail } : {}),
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    message: result.message,
    results: result.results,
    source: "cron",
  });
}
