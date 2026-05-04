interface ErrorBannerProps {
  message: string;
}

/** 對齊 design.pen errorBanner：左側 error 色條、secondary 底 */
export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="flex w-full items-center gap-3 rounded-[14px] border border-outline-variant border-l-4 border-l-error bg-secondary-container px-[18px] py-3.5"
      role="alert"
    >
      <span
        className="material-symbols-outlined shrink-0 text-error"
        style={{ fontSize: 18 }}
        aria-hidden
      >
        info
      </span>
      <p className="text-sm text-on-surface leading-relaxed">{message}</p>
    </div>
  );
}
