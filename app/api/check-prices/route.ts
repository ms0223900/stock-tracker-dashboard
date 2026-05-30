import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isCronAuthorized } from "@/lib/cron-auth";
import { WATCHLIST_FETCH_ERROR } from "@/lib/constants";
import { refreshWatchlistPrices } from "@/lib/refresh-watchlist-prices";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

async function runCheckPrices() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { items, notificationError } = await refreshWatchlistPrices(supabase);

    return NextResponse.json({ items, notificationError });
  } catch (error) {
    console.error("check-prices failed:", error);
    return NextResponse.json({ error: WATCHLIST_FETCH_ERROR }, { status: 500 });
  }
}

/** Vercel Cron 預設 GET；須帶 CRON_SECRET（Bearer 或 x-cron-secret）。 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCheckPrices();
}

/** 前端輪詢；維持不強制 secret。 */
export async function POST() {
  return runCheckPrices();
}
