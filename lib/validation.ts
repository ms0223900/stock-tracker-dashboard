export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

/** 英數字與 `.`；不強制 `XXXX.TW` 結尾 */
const SYMBOL_REGEX = /^[A-Za-z0-9.]+$/;

export function validateSymbol(symbol: string): ValidationResult {
  const trimmed = symbol.trim();

  if (!trimmed) {
    return { valid: false, error: "請輸入股票代號" };
  }

  if (!SYMBOL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "股票代號僅限英數字與句點（例如 2330.TW），請勿輸入中文、空格或其他標點",
    };
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
