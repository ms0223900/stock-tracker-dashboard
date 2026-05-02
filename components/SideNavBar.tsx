"use client";

export default function SideNavBar() {
  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-64px)] w-64 p-4 border-r border-outline-variant sticky top-16 bg-surface-container-lowest">
      <div className="mb-6 px-4">
        <p className="text-label-caps text-secondary tracking-widest">
          MARKET DATA
        </p>
        <p className="text-body-sm text-outline">Taiwan Stock Exchange</p>
      </div>
      <nav className="flex-1 space-y-1">
        <a
          className="flex items-center gap-3 px-4 py-3 text-primary bg-primary-fixed-dim rounded-md font-title-sm"
          href="#"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span>Dashboard</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low rounded-md font-body-md transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">visibility</span>
          <span>Watchlist</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low rounded-md font-body-md transition-colors"
          href="#"
        >
          <span className="material-symbols-outlined">notifications_active</span>
          <span>Alerts</span>
        </a>
      </nav>
      <div className="mt-xl pt-lg border-t border-outline-variant/50">
        <button className="w-full mb-4 py-2 px-4 bg-primary text-white font-title-sm rounded-md hover:bg-primary-container transition-all active:scale-[0.98]">
          Set Price Alert
        </button>
        <div className="space-y-1">
          <a
            className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low rounded-md font-body-sm transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">send</span>
            <span>Telegram Bot</span>
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-surface-container-low rounded-md font-body-sm transition-colors"
            href="#"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span>Support</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
