'use client';

import { useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase-client';

const REFRESH_THROTTLE_MS = 2000;

function notifyAccountRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('wallet:invalidate'));
}

export function PublicSessionWatchdog() {
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refresh = async () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastAttemptRef.current < REFRESH_THROTTLE_MS) return;
      lastAttemptRef.current = now;

      const user = auth.currentUser;
      if (user) {
        // Force token refresh to ensure it's still valid
        try {
          await user.getIdToken(true);
          notifyAccountRefresh();
        } catch {
          // Token refresh failed - user might need to re-authenticate
        }
      }
    };

    const handleFocus = () => {
      void refresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return null;
}
