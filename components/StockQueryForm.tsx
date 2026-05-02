"use client";

interface StockQueryFormProps {
  symbol: string;
  queryLoading: boolean;
  symbolError: string | null;
  onSymbolChange: (value: string) => void;
  onQuery: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function StockQueryForm({
  symbol,
  queryLoading,
  symbolError,
  onSymbolChange,
  onQuery,
  onKeyDown,
}: StockQueryFormProps) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant p-lg rounded-xl flex flex-col md:flex-row gap-md items-end">
      <div className="w-full">
        <label className="block text-label-caps text-outline mb-xs">
          QUICK QUERY
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. 2330.TW"
            type="text"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        {symbolError && (
          <p className="mt-1.5 text-body-sm text-error">{symbolError}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onQuery}
        disabled={queryLoading}
        className="px-xl py-3 bg-primary text-white font-title-sm rounded-md hover:bg-primary-container transition-all whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
      >
        {queryLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Querying...
          </span>
        ) : (
          "Query"
        )}
      </button>
    </section>
  );
}
