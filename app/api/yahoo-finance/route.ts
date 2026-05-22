import { NextResponse } from "next/server";

import { STOCK_FETCH_ERROR } from "@/lib/constants";
import { validateSymbol } from "@/lib/validation";
import {
  fetchStockPrice,
  serializeStockPrice,
  YahooFinanceError,
} from "@/lib/yahoo-finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get("symbol") ?? "";
  const validation = validateSymbol(rawSymbol);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  try {
    const stock = await fetchStockPrice(validation.symbol);
    return NextResponse.json({ data: serializeStockPrice(stock) });
  } catch (error) {
    const message =
      error instanceof YahooFinanceError ? error.message : STOCK_FETCH_ERROR;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
