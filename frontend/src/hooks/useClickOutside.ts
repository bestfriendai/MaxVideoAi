'use client';

import { useEffect, useRef, type RefObject } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Hook that triggers a callback when clicking outside of the referenced element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      const target = event.target as Node;

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, enabled]);

  return ref;
}

/**
 * Hook that triggers a callback when clicking outside of multiple referenced elements
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: Handler,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check if click is outside all refs
      const isOutside = refs.every((ref) => {
        const el = ref.current;
        return el && !el.contains(target);
      });

      if (isOutside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler, enabled]);
}
