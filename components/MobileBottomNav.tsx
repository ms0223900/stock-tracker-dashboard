"use client";

export default function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center py-2 px-4 z-50 pb-[env(safe-area-inset-bottom)]">
      <a className="flex flex-col items-center text-primary" href="#">
        <span className="material-symbols-outlined">dashboard</span>
        <span className="text-[10px] text-label-caps">HOME</span>
      </a>
      <a
        className="flex flex-col items-center text-secondary"
        href="#"
      >
        <span className="material-symbols-outlined">visibility</span>
        <span className="text-[10px] text-label-caps">WATCH</span>
      </a>
      <a
        className="flex flex-col items-center text-secondary"
        href="#"
      >
        <span className="material-symbols-outlined">query_stats</span>
        <span className="text-[10px] text-label-caps">STATS</span>
      </a>
      <a
        className="flex flex-col items-center text-secondary"
        href="#"
      >
        <span className="material-symbols-outlined">notifications_active</span>
        <span className="text-[10px] text-label-caps">ALERTS</span>
      </a>
    </nav>
  );
}
