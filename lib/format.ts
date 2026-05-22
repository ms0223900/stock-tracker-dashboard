export function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "—";
  }

  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatUpdateTime(date: Date): string {
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatVolume(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "—";
  }

  return value.toLocaleString("zh-TW");
}
