"use client";

import { useCallback, useState } from "react";

import { saveWatchlistItem } from "@/app/actions/watchlist";
import {
  WATCHLIST_SAVE_ERROR,
  WATCHLIST_SAVE_SUCCESS,
} from "@/lib/constants";
import { validateSymbol, validateTargetPrice } from "@/lib/validation";

export function useSaveWatchlist() {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const saveWatchlist = useCallback(
    async (symbolInput: string, targetPriceInput: string) => {
      const symbolValidation = validateSymbol(symbolInput);

      if (!symbolValidation.ok) {
        setSuccessMessage(null);
        setErrorMessage(symbolValidation.message);
        return;
      }

      const priceValidation = validateTargetPrice(targetPriceInput);

      if (!priceValidation.ok) {
        setSuccessMessage(null);
        setErrorMessage(priceValidation.message);
        return;
      }

      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const result = await saveWatchlistItem(symbolInput, targetPriceInput);

        if (!result.ok) {
          setErrorMessage(result.message);
          return;
        }

        setSuccessMessage(WATCHLIST_SAVE_SUCCESS);
      } catch {
        setErrorMessage(WATCHLIST_SAVE_ERROR);
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return {
    saveWatchlist,
    isSaving,
    errorMessage,
    successMessage,
    clearMessages,
  };
}
