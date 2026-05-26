import { NextResponse } from "next/server";

import { WATCHLIST_FETCH_ERROR } from "@/lib/constants";
import { refreshWatchlistPrices } from "@/lib/refresh-watchlist-prices";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { items, notificationError } = await refreshWatchlistPrices(supabase);

    return NextResponse.json({ items, notificationError });
  } catch (error) {
    console.error("check-prices failed:", error);
    return NextResponse.json({ error: WATCHLIST_FETCH_ERROR }, { status: 500 });
  }
}
