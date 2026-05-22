import {
  formatPrice,
  formatUpdateTime,
  formatVolume,
} from "@/lib/format";
import type { StockPrice } from "@/types/stock";

type StockResultCardProps = {
  stock: StockPrice;
};

const OHLC_ITEMS = [
  { label: "最高", format: formatPrice, key: "high" as const },
  { label: "最低", format: formatPrice, key: "low" as const },
  { label: "開盤", format: formatPrice, key: "open" as const },
  { label: "成交量", format: formatVolume, key: "volume" as const },
];

export function StockResultCard({ stock }: StockResultCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-on-background">
            {stock.symbol}
          </h2>
          <p className="mt-1 text-[13px] text-on-background-muted">
            更新時間：{formatUpdateTime(stock.updateTime)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[36px] font-bold leading-none text-primary">
            {formatPrice(stock.price)}
          </p>
          <p className="mt-1 text-[13px] text-on-background-muted">
            {stock.currency}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {OHLC_ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-[14px] border border-border bg-card-muted px-4 py-3"
          >
            <p className="text-xs text-on-background-muted">{item.label}</p>
            <p className="mt-1 text-base font-semibold text-on-background">
              {item.format(stock[item.key])}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
