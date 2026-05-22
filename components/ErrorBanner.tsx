type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[14px] border border-border bg-secondary px-4 py-3"
      style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-error)" }}
    >
      <span
        className="material-symbols-outlined shrink-0 text-error"
        aria-hidden="true"
      >
        error
      </span>
      <p className="text-sm leading-6 text-on-background">{message}</p>
    </div>
  );
}
