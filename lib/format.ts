export function formatPrice(n: number | null): string {
  return n !== null
    ? `$${n.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
}
