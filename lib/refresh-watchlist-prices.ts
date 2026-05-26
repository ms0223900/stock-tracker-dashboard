import type { SupabaseClient } from "@supabase/supabase-js";

import { NOTIFICATION_SEND_ERROR } from "@/lib/constants";
import { sendTargetPriceAlert } from "@/lib/telegram";
import { fetchStockPrice } from "@/lib/yahoo-finance";
import { normalizeWatchlistRow } from "@/lib/watchlist-db";
import type { WatchlistItemDisplay } from "@/types/watchlist";

export type RefreshWatchlistPricesResult = {
  items: WatchlistItemDisplay[];
  notificationError: string | null;
};

async function tryNotifyTargetReached(
  supabase: SupabaseClient,
  item: WatchlistItemDisplay,
  currentPrice: number,
): Promise<{ item: WatchlistItemDisplay; notificationFailed: boolean }> {
  if (item.is_notified || currentPrice < item.target_price) {
    return { item, notificationFailed: false };
  }

  const triggeredAt = new Date();
  const sendResult = await sendTargetPriceAlert({
    symbol: item.symbol,
    currentPrice,
    targetPrice: item.target_price,
    triggeredAt,
  });

  if (!sendResult.ok) {
    return { item, notificationFailed: true };
  }

  const notifiedAt = triggeredAt.toISOString();
  const { data: notifiedRow, error: notifyUpdateError } = await supabase
    .from("watchlist")
    .update({
      is_notified: true,
      notified_at: notifiedAt,
    })
    .eq("id", item.id)
    .eq("is_notified", false)
    .select("id")
    .maybeSingle();

  if (notifyUpdateError || !notifiedRow) {
    console.error(
      `failed to mark is_notified for ${item.symbol}:`,
      notifyUpdateError ?? "no row updated",
    );
    return { item, notificationFailed: true };
  }

  return {
    item: {
      ...item,
      is_notified: true,
      notified_at: notifiedAt,
    },
    notificationFailed: false,
  };
}

export async function refreshWatchlistPrices(
  supabase: SupabaseClient,
): Promise<RefreshWatchlistPricesResult> {
  const { data: rows, error } = await supabase
    .from("watchlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = (rows ?? []).map(normalizeWatchlistRow);

  let notificationFailed = false;

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      const stock = await fetchStockPrice(item.symbol);
      const updatedAt = new Date().toISOString();

      const { data: updatedRow, error: updateError } = await supabase
        .from("watchlist")
        .update({
          last_price: stock.price,
          updated_at: updatedAt,
        })
        .eq("id", item.id)
        .select("id")
        .maybeSingle();

      if (updateError || !updatedRow) {
        throw updateError ?? new Error(`failed to update last_price for ${item.symbol}`);
      }

      const refreshedItem = {
        ...item,
        last_price: stock.price,
        updated_at: updatedAt,
        priceFetchFailed: false,
        chartData: stock.chartData,
      } satisfies WatchlistItemDisplay;

      const notifyResult = await tryNotifyTargetReached(
        supabase,
        refreshedItem,
        stock.price,
      );

      if (notifyResult.notificationFailed) {
        notificationFailed = true;
      }

      return notifyResult.item;
    }),
  );

  const refreshedItems = items.map((item, index) => {
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

  return {
    items: refreshedItems,
    notificationError: notificationFailed ? NOTIFICATION_SEND_ERROR : null,
  };
}
