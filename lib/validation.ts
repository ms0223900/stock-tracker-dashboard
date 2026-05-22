import { SYMBOL_FORMAT_ERROR } from "@/lib/constants";

const TW_STOCK_SYMBOL_PATTERN = /^\d+\.TW$/i;

export type SymbolValidationResult =
  | { ok: true; symbol: string }
  | { ok: false; message: string };

export function validateSymbol(input: string): SymbolValidationResult {
  const trimmed = input.trim();

  if (!trimmed || !TW_STOCK_SYMBOL_PATTERN.test(trimmed)) {
    return { ok: false, message: SYMBOL_FORMAT_ERROR };
  }

  return { ok: true, symbol: trimmed.toUpperCase() };
}
