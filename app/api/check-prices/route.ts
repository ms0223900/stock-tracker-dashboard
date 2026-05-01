import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchStockPriceServer } from "@/lib/yahoo-finance";
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

export async function GET() {
  const results: string[] = [];

  try {
    // 1. Read all watchlist items
    const supabase = getSupabase();
    const { data: items, error: fetchError } = await supabase
      .from("watchlist")
      .select("*");

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch watchlist", detail: fetchError.message },
        { status: 500 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Watchlist is empty", results });
    }

    const rows = items as WatchlistRow[];

    // 2. Process each item
    for (const item of rows) {
      try {
        const price = await fetchStockPriceServer(item.symbol);

        // Update last_price in DB
        await supabase
          .from("watchlist")
          .update({ last_price: price.currentPrice, updated_at: new Date().toISOString() })
          .eq("id", item.id);

        // Check trigger: price >= target and not already notified
        if (price.currentPrice >= item.target_price && !item.is_notified) {
          const sent = await sendTelegramMessage(
            item.symbol,
            price.currentPrice,
            item.target_price,
          );

          if (sent) {
            await supabase
              .from("watchlist")
              .update({
                is_notified: true,
                notified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            results.push(`${item.symbol}: notified ($${price.currentPrice} >= $${item.target_price})`);
          } else {
            results.push(`${item.symbol}: trigger met but Telegram send failed, is_notified kept false`);
          }
        } else if (price.currentPrice >= item.target_price && item.is_notified) {
          results.push(`${item.symbol}: already notified, skipped`);
        } else {
          results.push(
            `${item.symbol}: $${price.currentPrice} < $${item.target_price}, no notification`,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`${item.symbol}: error — ${msg}`);
      }
    }

    return NextResponse.json({ message: "Check complete", results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
