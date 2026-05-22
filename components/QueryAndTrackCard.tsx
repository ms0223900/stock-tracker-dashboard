"use client";

import { FormEvent, useState } from "react";

type QueryAndTrackCardProps = {
  isLoading: boolean;
  onQuery: (symbol: string) => void;
};

export function QueryAndTrackCard({ isLoading, onQuery }: QueryAndTrackCardProps) {
  const [symbol, setSymbol] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onQuery(symbol);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-7">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-on-background">查詢與追蹤</h2>
        <p className="mt-1 text-sm text-on-background-muted">
          輸入完整台股代號查詢即時股價，例如 2330.TW
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">股票代號</span>
          <input
            type="text"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="2330.TW"
            className="h-12 w-full rounded-[14px] border border-border bg-card-muted px-[18px] text-base text-on-background outline-none placeholder:text-on-background-muted focus:border-primary"
            autoComplete="off"
            disabled={isLoading}
          />
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            search
          </span>
          {isLoading ? "查詢中" : "查詢股價"}
        </button>
      </form>
    </section>
  );
}
