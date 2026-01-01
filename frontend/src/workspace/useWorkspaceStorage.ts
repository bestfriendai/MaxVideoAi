'use client';

import { useCallback, useMemo } from 'react';

export type WorkspaceStorage = {
  storageScope: string;
  storageKey: (base: string, scope?: string) => string;
  readStorage: (base: string) => string | null;
  readScopedStorage: (base: string) => string | null;
  writeStorage: (base: string, value: string | null) => void;
  writeScopedStorage: (base: string, value: string | null) => void;
};

export function useWorkspaceStorage(userId: string | null): WorkspaceStorage {
  const storageScope = useMemo(() => userId ?? 'anon', [userId]);

  const storageKey = useCallback(
    (base: string, scope: string = storageScope) => `${base}:${scope}`,
    [storageScope]
  );

  const readScopedStorage = useCallback(
    (base: string): string | null => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(storageKey(base));
    },
    [storageKey]
  );

  const readStorage = useCallback(
    (base: string): string | null => {
      if (typeof window === 'undefined') return null;

      if (storageScope === 'anon') {
        const baseValue = window.localStorage.getItem(base);
        if (baseValue !== null) return baseValue;
        return window.localStorage.getItem(storageKey(base));
      }

      const scopedValue = window.localStorage.getItem(storageKey(base));
      if (scopedValue !== null) return scopedValue;

      const baseValue = window.localStorage.getItem(base);
      if (baseValue !== null) return baseValue;

      const anonValue = window.localStorage.getItem(storageKey(base, 'anon'));
      if (anonValue !== null) return anonValue;

      return null;
    },
    [storageKey, storageScope]
  );

  const writeScopedStorage = useCallback(
    (base: string, value: string | null) => {
      if (typeof window === 'undefined') return;
      const key = storageKey(base);
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
      window.localStorage.removeItem(base);
    },
    [storageKey]
  );

  const writeStorage = useCallback(
    (base: string, value: string | null) => {
      if (typeof window === 'undefined') return;
      const key = storageKey(base);
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
      if (value === null) {
        window.localStorage.removeItem(base);
      } else {
        window.localStorage.setItem(base, value);
      }
    },
    [storageKey]
  );

  return {
    storageScope,
    storageKey,
    readStorage,
    readScopedStorage,
    writeStorage,
    writeScopedStorage,
  };
}
