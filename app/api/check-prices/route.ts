import { NextResponse } from "next/server";

import { WATCHLIST_FETCH_ERROR } from "@/lib/constants";
import { refreshWatchlistPrices } from "@/lib/refresh-watchlist-prices";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const items = await refreshWatchlistPrices(supabase);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("check-prices failed:", error);
    return NextResponse.json({ error: WATCHLIST_FETCH_ERROR }, { status: 500 });
  }
}
