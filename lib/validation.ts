export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const SYMBOL_REGEX = /^[A-Za-z0-9.]+\.[Tt][Ww]$/;

export function validateSymbol(symbol: string): ValidationResult {
  const trimmed = symbol.trim();

  if (!trimmed) {
    return { valid: false, error: "請輸入完整股票代號，例如 2330.TW" };
  }

  if (!SYMBOL_REGEX.test(trimmed)) {
    return { valid: false, error: "請輸入完整股票代號，例如 2330.TW" };
  }

  return { valid: true, error: null };
}

export function validateTargetPrice(value: string): ValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "請輸入大於 0 的目標股價" };
  }

  const num = Number(trimmed);

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { valid: false, error: "請輸入大於 0 的目標股價" };
  }

  if (num <= 0) {
    return { valid: false, error: "請輸入大於 0 的目標股價" };
  }

  return { valid: true, error: null };
}
