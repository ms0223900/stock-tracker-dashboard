"use server";

import { WATCHLIST_FETCH_ERROR, WATCHLIST_SAVE_ERROR } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeWatchlistRow } from "@/lib/watchlist-db";
import { validateSymbol, validateTargetPrice } from "@/lib/validation";
import type { WatchlistItem } from "@/types/watchlist";

export type SaveWatchlistResult =
  | { ok: true }
  | { ok: false; message: string };

export type GetWatchlistResult =
  | { ok: true; items: WatchlistItem[] }
  | { ok: false; message: string };

export async function getWatchlistItems(): Promise<GetWatchlistResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("watchlist fetch failed:", error.message);
      return { ok: false, message: WATCHLIST_FETCH_ERROR };
    }

    return {
      ok: true,
      items: (data ?? []).map(normalizeWatchlistRow),
    };
  } catch (error) {
    console.error("watchlist fetch failed:", error);
    return { ok: false, message: WATCHLIST_FETCH_ERROR };
  }
}

export async function saveWatchlistItem(
  symbolInput: string,
  targetPriceInput: string,
): Promise<SaveWatchlistResult> {
  const symbolValidation = validateSymbol(symbolInput);

  if (!symbolValidation.ok) {
    return { ok: false, message: symbolValidation.message };
  }

  const priceValidation = validateTargetPrice(targetPriceInput);

  if (!priceValidation.ok) {
    return { ok: false, message: priceValidation.message };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("watchlist").insert({
      symbol: symbolValidation.symbol,
      target_price: priceValidation.price,
    });

    if (error) {
      console.error("watchlist insert failed:", error.message);
      return { ok: false, message: WATCHLIST_SAVE_ERROR };
    }

    return { ok: true };
  } catch (error) {
    console.error("watchlist save failed:", error);
    return { ok: false, message: WATCHLIST_SAVE_ERROR };
  }
}
