import { runWatchlistPriceCheck } from "@/lib/run-watchlist-price-check";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
  })
}
