'use client';

import { useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'workspace.v1';

export type WorkspacePersistenceState = {
  engineId?: string;
  mode?: string;
  prompt?: string;
  negativePrompt?: string;
  durationSec?: number;
  aspectRatio?: string;
  resolution?: string;
  audio?: boolean;
};

export type UseWorkspacePersistenceOptions = {
  enabled?: boolean;
  debounceMs?: number;
  storageKey?: string;
};

export function useWorkspacePersistence(
  state: WorkspacePersistenceState,
  onRestore: (value: WorkspacePersistenceState) => void,
  options: UseWorkspacePersistenceOptions = {}
) {
  const { enabled = true, debounceMs = 500, storageKey = STORAGE_KEY } = options;
  const onRestoreRef = useRef(onRestore);
  const initialRestoreDone = useRef(false);

  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (initialRestoreDone.current) return;
    initialRestoreDone.current = true;

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') {
        onRestoreRef.current(parsed as WorkspacePersistenceState);
      }
    } catch {
      // Ignore invalid stored state
    }
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, state, debounceMs, storageKey]);

  const clearStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore errors
    }
  }, [storageKey]);

  return { clearStorage };
}
