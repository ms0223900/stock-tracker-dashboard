"use client";

import { useId, useState } from "react";

interface WatchlistNoteFieldProps {
  itemId: string;
  symbol: string;
  savedNote: string | null;
  updating: boolean;
  error: string | null;
  onUpdate: (id: string, value: string) => Promise<string | null | false>;
  onClearError: (id: string) => void;
}

export default function WatchlistNoteField({
  itemId,
  symbol,
  savedNote,
  updating,
  error,
  onUpdate,
  onClearError,
}: WatchlistNoteFieldProps) {
  const savedText = savedNote ?? "";
  const [baseline, setBaseline] = useState(savedText);
  const [draft, setDraft] = useState(savedText);

  if (savedText !== baseline && draft === baseline) {
    setBaseline(savedText);
    setDraft(savedText);
  }

  const isDirty = draft !== baseline;
  const errorId = useId();
  const textareaId = useId();

  const handleConfirm = async () => {
    const result = await onUpdate(itemId, draft);
    if (result !== false) {
      const next = result ?? "";
      setBaseline(next);
      setDraft(next);
    }
  };

  const handleCancel = () => {
    setDraft(baseline);
    onClearError(itemId);
  };

  const handleChange = (value: string) => {
    setDraft(value);
    if (error) {
      onClearError(itemId);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={textareaId} className="text-xs font-semibold text-on-surface-variant">
        備註
      </label>
      <textarea
        id={textareaId}
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="尚無備註"
        rows={2}
        aria-label={`${symbol} 備註`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={updating}
        className="w-full resize-y min-h-[72px] rounded-[14px] border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 wrap-break-word focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
      />
      {/* {error ? (
        <p id={errorId} className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null} */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={updating || !isDirty}
          className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-secondary-container px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:opacity-95 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updating ? "更新中…" : "確認更新"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={updating || !isDirty}
          className="inline-flex items-center justify-center rounded-full border border-outline-variant px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}
