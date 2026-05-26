"use client";

import { FormEvent, useState } from "react";

import { StockChart } from "@/components/StockChart";
import {
  formatPrice,
  formatUpdateTime,
  formatVolume,
} from "@/lib/format";
import type { StockPrice } from "@/types/stock";

type StockResultCardProps = {
  stock: StockPrice;
  isSaving: boolean;
  onSave: (targetPrice: string) => void;
};

const OHLC_ITEMS = [
  { label: "最高", format: formatPrice, key: "high" as const },
  { label: "最低", format: formatPrice, key: "low" as const },
  { label: "開盤", format: formatPrice, key: "open" as const },
  { label: "成交量", format: formatVolume, key: "volume" as const },
];

export function StockResultCard({
  stock,
  isSaving,
  onSave,
}: StockResultCardProps) {
  const [targetPrice, setTargetPrice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(targetPrice);
  }

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

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="text-[36px] font-bold leading-none text-primary">
              {formatPrice(stock.price)}
            </p>
            <p className="mt-1 text-[13px] text-on-background-muted">
              {stock.currency}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs text-on-background-muted">目標股價</span>
              <input
                type="text"
                inputMode="decimal"
                value={targetPrice}
                onChange={(event) => setTargetPrice(event.target.value)}
                placeholder="2200"
                disabled={isSaving}
                className="h-12 w-[120px] rounded-[14px] border border-border bg-card-muted px-4 text-base text-on-background outline-none placeholder:text-on-background-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                autoComplete="off"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-secondary px-5 text-[15px] font-semibold text-on-background transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                aria-hidden="true"
              >
                notifications
              </span>
              {isSaving ? "儲存中" : "儲存目標股價"}
            </button>
          </form>
        </div>
      </div>

      <StockChart chartData={stock.chartData} updateTime={stock.updateTime} />

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
