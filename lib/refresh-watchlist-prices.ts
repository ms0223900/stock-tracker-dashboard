import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchStockPrice } from "@/lib/yahoo-finance";
import { normalizeWatchlistRow } from "@/lib/watchlist-db";
import type { WatchlistItemDisplay } from "@/types/watchlist";

export async function refreshWatchlistPrices(
  supabase: SupabaseClient,
): Promise<WatchlistItemDisplay[]> {
  const { data: rows, error } = await supabase
    .from("watchlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = (rows ?? []).map(normalizeWatchlistRow);

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const stock = await fetchStockPrice(item.symbol);
      const updatedAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("watchlist")
        .update({
          last_price: stock.price,
          updated_at: updatedAt,
        })
        .eq("id", item.id);

      if (updateError) {
        throw updateError;
      }

      return {
        ...item,
        last_price: stock.price,
        updated_at: updatedAt,
        priceFetchFailed: false,
      } satisfies WatchlistItemDisplay;
    }),
  );

  return items.map((item, index) => {
    const result = settled[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    console.error(
      `watchlist price refresh failed for ${item.symbol}:`,
      result.reason,
    );

    return {
      ...item,
      priceFetchFailed: true,
    };
  });
}
