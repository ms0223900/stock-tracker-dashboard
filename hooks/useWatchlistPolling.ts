"use client";

import { useEffect } from "react";

import { POLL_INTERVAL_MS } from "@/lib/constants";

type UseWatchlistPollingOptions = {
  enabled?: boolean;
  onTick: () => void | Promise<void>;
};

export function useWatchlistPolling({
  enabled = true,
  onTick,
}: UseWatchlistPollingOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void onTick();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, onTick]);
}
