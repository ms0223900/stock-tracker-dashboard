import { SYMBOL_FORMAT_ERROR, TARGET_PRICE_ERROR } from "@/lib/constants";

/** 英數字；可含 `.` 後綴（如 2330.TW、7000.HK） */
const STOCK_SYMBOL_PATTERN = /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*$/;

export type SymbolValidationResult =
  | { ok: true; symbol: string }
  | { ok: false; message: string };

export type TargetPriceValidationResult =
  | { ok: true; price: number }
  | { ok: false; message: string };

export function validateSymbol(input: string): SymbolValidationResult {
  const trimmed = input.trim();

  if (!trimmed || !STOCK_SYMBOL_PATTERN.test(trimmed)) {
    return { ok: false, message: SYMBOL_FORMAT_ERROR };
  }

  return { ok: true, symbol: trimmed.toUpperCase() };
}

export function validateTargetPrice(
  input: string,
): TargetPriceValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, message: TARGET_PRICE_ERROR };
  }

  const price = Number(trimmed);

  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: TARGET_PRICE_ERROR };
  }

  return { ok: true, price };
}
