type SuccessBannerProps = {
  message: string;
};

export function SuccessBanner({ message }: SuccessBannerProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-[14px] border border-border bg-card-muted px-4 py-3"
      style={{ borderLeftWidth: "4px", borderLeftColor: "var(--color-primary)" }}
    >
      <span
        className="material-symbols-outlined shrink-0 text-primary"
        aria-hidden="true"
      >
        check_circle
      </span>
      <p className="text-sm leading-6 text-on-background">{message}</p>
    </div>
  );
}
