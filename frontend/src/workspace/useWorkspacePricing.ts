'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PreflightRequest, PreflightResponse } from '@/types/engines';
import { runPreflight } from '@/lib/api';

export type WorkspacePricingOptions = {
  enabled: boolean;
  request: PreflightRequest | null;
  debounceMs?: number;
  onError?: (message: string | undefined) => void;
  onUpdate?: (response: PreflightResponse | null) => void;
  onPricing?: (isPricing: boolean) => void;
};

export function useWorkspacePricing({
  enabled,
  request,
  debounceMs = 200,
  onError,
  onUpdate,
  onPricing,
}: WorkspacePricingOptions) {
  const [preflight, setPreflight] = useState<PreflightResponse | null>(null);
  const [isPricing, setIsPricing] = useState(false);
  const updatePreflight = useCallback((response: PreflightResponse | null) => {
    setPreflight(response);
    onUpdate?.(response);
  }, [onUpdate]);
  const updatePricing = useCallback((value: boolean) => {
    setIsPricing(value);
    onPricing?.(value);
  }, [onPricing]);

  useEffect(() => {
    if (!enabled || !request) return;
    let canceled = false;
    onError?.(undefined);
    updatePricing(true);

    const timer = window.setTimeout(() => {
      Promise.resolve()
        .then(() => runPreflight(request))
        .then((response) => {
          if (canceled) return;
          updatePreflight(response);
        })
        .catch((err) => {
          if (canceled) return;
          console.error('[preflight] failed', err);
          onError?.(err instanceof Error ? err.message : 'Preflight failed');
        })
        .finally(() => {
          if (!canceled) {
            updatePricing(false);
          }
        });
    }, debounceMs);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [enabled, request, debounceMs, onError, updatePreflight, updatePricing]);

  return { preflight, isPricing, setPreflight };
}
