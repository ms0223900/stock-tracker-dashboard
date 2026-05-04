"use client";

import type { KeyboardEvent } from "react";

interface QueryAndTrackCardProps {
  symbol: string;
  targetPrice: string;
  queryLoading: boolean;
  saving: boolean;
  hasStockResult: boolean;
  symbolError: string | null;
  targetPriceError: string | null;
  onSymbolChange: (value: string) => void;
  onTargetPriceChange: (value: string) => void;
  onQuery: () => void;
  onSave: () => void;
  onSymbolKeyDown: (e: KeyboardEvent) => void;
}

export default function QueryAndTrackCard({
  symbol,
  targetPrice,
  queryLoading,
  saving,
  hasStockResult,
  symbolError,
  targetPriceError,
  onSymbolChange,
  onTargetPriceChange,
  onQuery,
  onSave,
  onSymbolKeyDown,
}: QueryAndTrackCardProps) {
  const saveDisabled = saving || !hasStockResult;

  return (
    <section className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-xl font-bold text-on-surface">查詢與追蹤</h2>
        <span className="inline-flex items-center rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground w-fit">
          單頁完成
        </span>
      </div>

      <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">
        格式須為 ○○○○.TW；目標價須大於 0。達標後會發送 Telegram 通知。
      </p>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 min-w-0">
          <label
            htmlFor="stock-symbol"
            className="block text-[13px] font-semibold text-on-surface mb-2"
          >
            股票代號
          </label>
          <input
            id="stock-symbol"
            className="h-12 w-full rounded-[14px] border border-outline-variant bg-surface-container-low px-[18px] text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
            placeholder="2330.TW"
            type="text"
            autoComplete="off"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            onKeyDown={onSymbolKeyDown}
          />
          {symbolError ? (
            <p className="mt-1.5 text-sm text-error">{symbolError}</p>
          ) : null}
        </div>

        <div className="w-full lg:w-[260px] shrink-0">
          <label
            htmlFor="target-price"
            className="block text-[13px] font-semibold text-on-surface mb-2"
          >
            目標股價
          </label>
          <input
            id="target-price"
            className="h-12 w-full rounded-[14px] border border-outline-variant bg-surface-container-low px-[18px] text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
            placeholder="2200"
            type="number"
            min={0}
            step="any"
            value={targetPrice}
            onChange={(e) => onTargetPriceChange(e.target.value)}
          />
          {targetPriceError ? (
            <p className="mt-1.5 text-sm text-error">{targetPriceError}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onQuery}
          disabled={queryLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-on-primary hover:opacity-95 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            search
          </span>
          {queryLoading ? "查詢中…" : "查詢股價"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-secondary-container px-6 text-[15px] font-semibold text-on-surface hover:opacity-95 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden>
            notifications_active
          </span>
          {saving ? "儲存中…" : "儲存追蹤"}
        </button>
      </div>
    </section>
  );
}
