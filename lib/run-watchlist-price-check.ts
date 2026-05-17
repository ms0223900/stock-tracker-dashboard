import { createClient } from "@supabase/supabase-js";
import { fetchStockPriceServer, isAmbiguousPrevCloseSnapshot } from "@/lib/yahoo-finance";
import {
  isLinePushConfigured,
  LinePushHttpError,
  sendLineText,
} from "@/lib/line";
import { buildStockHitNotificationMessage } from "@/lib/stock-hit-notification-message";
import { sendTelegramMessage } from "@/lib/telegram";

interface WatchlistRow {
  id: string;
  symbol: string;
  target_price: number;
  last_price: number | null;
  is_notified: boolean;
  notified_at: string | null;
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}

export type RunWatchlistPriceCheckResult =
  | { ok: true; message: string; results: string[] }
  | {
      ok: false;
      status: number;
      error: string;
      detail?: string;
    };

/** 讀取 watchlist、更新價格、達標時發送 Telegram／LINE（與 US-002 規則一致）。 */
export async function runWatchlistPriceCheck(): Promise<RunWatchlistPriceCheckResult> {
  const results: string[] = [];

  try {
    const supabase = getSupabase();
    const { data: items, error: fetchError } = await supabase
      .from("watchlist")
      .select("*");

    if (fetchError) {
      return {
        ok: false,
        status: 500,
        error: "Failed to fetch watchlist",
        detail: fetchError.message,
      };
    }

    if (!items || items.length === 0) {
      return { ok: true, message: "Watchlist is empty", results };
    }

    const rows = items as WatchlistRow[];

    for (const item of rows) {
      try {
        const price = await fetchStockPriceServer(item.symbol);
        const ambiguous = isAmbiguousPrevCloseSnapshot(price);

        if (!ambiguous) {
          await supabase
            .from("watchlist")
            .update({
              last_price: price.currentPrice,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }

        const triggerPrice = ambiguous
          ? (item.last_price ?? price.currentPrice)
          : price.currentPrice;

        if (triggerPrice >= item.target_price && !item.is_notified) {
          const telegramSent = await sendTelegramMessage(
            item.symbol,
            triggerPrice,
            item.target_price,
          );

          let lineSent = true;
          let lineDetail = "";
          if (telegramSent && isLinePushConfigured()) {
            const lineUserId = process.env.LINE_USER_ID?.trim();
            if (!lineUserId) {
              lineSent = false;
              lineDetail = "LINE_USER_ID 未設定";
            } else {
              try {
                await sendLineText(
                  lineUserId,
                  buildStockHitNotificationMessage(
                    item.symbol,
                    triggerPrice,
                    item.target_price,
                  ),
                );
              } catch (err) {
                lineSent = false;
                if (err instanceof LinePushHttpError) {
                  lineDetail = `LINE HTTP ${err.status}: ${err.bodySnippet}`;
                  console.error(
                    `${item.symbol} LINE notify failed:`,
                    err.status,
                    err.bodySnippet,
                  );
                } else {
                  const msg = err instanceof Error ? err.message : String(err);
                  lineDetail = msg;
                  console.error(`${item.symbol} LINE notify failed:`, msg);
                }
              }
            }
          }

          if (telegramSent && lineSent) {
            await supabase
              .from("watchlist")
              .update({
                is_notified: true,
                notified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            results.push(
              `${item.symbol}: notified ($${triggerPrice} >= $${item.target_price})`,
            );
          } else if (!telegramSent) {
            results.push(
              `${item.symbol}: trigger met but Telegram send failed, is_notified kept false`,
            );
          } else {
            results.push(
              `${item.symbol}: trigger met, Telegram ok but LINE failed (${lineDetail}), is_notified kept false`,
            );
          }
        } else if (triggerPrice >= item.target_price && item.is_notified) {
          results.push(`${item.symbol}: already notified, skipped`);
        } else {
          results.push(
            `${item.symbol}: $${triggerPrice} < $${item.target_price}, no notification`,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`${item.symbol}: error — ${msg}`);
      }
    }

    return { ok: true, message: "Check complete", results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 500, error: msg };
  }
}
