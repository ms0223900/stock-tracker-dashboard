import { TWSE_DOWN, TWSE_NEUTRAL, TWSE_UP } from "@/lib/constants";
import type { TwseMovement } from "@/lib/yahoo-finance";

const TEXT_CLASS: Record<TwseMovement, string> = {
  up: "text-twse-up",
  down: "text-twse-down",
  neutral: "text-twse-neutral",
};

const TREND_ICON: Record<TwseMovement, string> = {
  up: "trending_up",
  down: "trending_down",
  neutral: "trending_flat",
};

/** 漲跌列等：一律使用台股指數色（無 primary fallback）。 */
export function twseMovementTextClass(movement: TwseMovement): string {
  return TEXT_CLASS[movement];
}

/** 查詢結果主報價：無昨收可比時用 brand primary。 */
export function twseQuoteHeadlineTextClass(
  movement: TwseMovement,
  hasPreviousClose: boolean,
): string {
  return hasPreviousClose ? twseMovementTextClass(movement) : "text-primary";
}

/** 追蹤清單最新價：無報價或無昨收可比時用 primary。 */
export function twseWatchlistLatestTextClass(
  movement: TwseMovement,
  lastPrice: number | null,
  previousClose: number | null,
): string {
  if (lastPrice === null) return "text-primary";
  return twseQuoteHeadlineTextClass(movement, previousClose !== null);
}

export function twseMovementTrendIcon(movement: TwseMovement): string {
  return TREND_ICON[movement];
}

/** Recharts／SVG stroke；與 lib/constants 之 TWSE_* 同色。 */
export function twseMovementHex(movement: TwseMovement): string {
  switch (movement) {
    case "up":
      return TWSE_UP;
    case "down":
      return TWSE_DOWN;
    default:
      return TWSE_NEUTRAL;
  }
}
