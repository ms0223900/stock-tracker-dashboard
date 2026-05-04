export default function DashboardHeader() {
  return (
    <header className="w-full max-w-[1280px] mx-auto px-4 sm:px-10 pt-6 pb-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <span
            className="material-symbols-outlined shrink-0 text-primary"
            style={{ fontSize: 32 }}
            aria-hidden
          >
            activity
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              股價看板
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              輕鬆看股，愉快追蹤
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
