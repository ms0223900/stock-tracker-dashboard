"use server";

import { WATCHLIST_SAVE_ERROR } from "@/lib/constants";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateSymbol, validateTargetPrice } from "@/lib/validation";

export type SaveWatchlistResult =
  | { ok: true }
  | { ok: false; message: string };

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
