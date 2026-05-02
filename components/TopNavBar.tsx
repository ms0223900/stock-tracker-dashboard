"use client";

import { useState, useEffect } from "react";
import { BRAND_NAME } from "@/lib/constants";

export default function TopNavBar() {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 w-full bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center gap-lg">
        <span className="text-headline-md text-primary">
          {BRAND_NAME}
        </span>
        <div className="relative hidden lg:block w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-md text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search stocks..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-full">
          <span className="material-symbols-outlined text-sm text-primary animate-spin">
            sync
          </span>
          <span className="text-label-caps text-on-surface-variant">
            Next update in{" "}
            <span className="text-primary font-bold">{countdown}</span>s
          </span>
        </div>
      </div>
      <div className="flex items-center gap-md">
        <button
          className="p-2 hover:bg-surface-container-low transition-colors rounded-full text-secondary"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          className="p-2 hover:bg-surface-container-low transition-colors rounded-full text-secondary"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button
          className="p-2 hover:bg-surface-container-low transition-colors rounded-full text-secondary"
          aria-label="Account"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
