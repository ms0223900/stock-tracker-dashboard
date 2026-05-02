"use client";

interface TargetPriceFormProps {
  targetPrice: string;
  targetPriceError: string | null;
  saving: boolean;
  saveError: string | null;
  onTargetPriceChange: (value: string) => void;
  onSave: () => void;
}

export default function TargetPriceForm({
  targetPrice,
  targetPriceError,
  saving,
  saveError,
  onTargetPriceChange,
  onSave,
}: TargetPriceFormProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex-1">
      <h2 className="text-title-sm mb-lg flex items-center gap-xs">
        <span className="material-symbols-outlined text-primary">
          add_alert
        </span>
        Set Target Price
      </h2>
      <div className="space-y-lg">
        <div>
          <label className="block text-label-caps text-outline mb-xs">
            TRIGGER PRICE (TWD)
          </label>
          <input
            className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-md text-data-mono text-title-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Enter target..."
            type="number"
            value={targetPrice}
            onChange={(e) => onTargetPriceChange(e.target.value)}
          />
          {targetPriceError && (
            <p className="mt-1.5 text-body-sm text-error">
              {targetPriceError}
            </p>
          )}
        </div>
        <div>
          <label className="block text-label-caps text-outline mb-xs">
            CONDITION
          </label>
          <select className="w-full px-md py-3 bg-surface-container-low border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>Price is Above</option>
            <option>Price is Below</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full py-3 bg-primary text-white font-title-sm rounded-md hover:bg-primary-container transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Alert"}
        </button>
        {saveError && (
          <p className="text-body-sm text-error">{saveError}</p>
        )}
      </div>
    </div>
  );
}
