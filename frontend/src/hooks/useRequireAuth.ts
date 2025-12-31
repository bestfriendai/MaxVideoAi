'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import {
  disableClarityForVisitor,
  enableClarityForVisitor,
  ensureClarityVisitorId,
  isClarityEnabledForRuntime,
  queueClarityCommand,
} from '@/lib/clarity-client';
import { consumeLogoutIntent } from '@/lib/logout-intent';
import { clearLastKnownAccount, readLastKnownUserId, writeLastKnownUserId } from '@/lib/last-known';

// Compatible session/user types for existing code
type MockSession = {
  user: { id: string; email?: string | null };
  access_token: string;
};

type MockUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type RequireAuthResult = {
  userId: string | null;
  user: MockUser | null;
  session: MockSession | null;
  loading: boolean;
  authStatus: 'unknown' | 'refreshing' | 'authed' | 'loggedOut';
  getIdToken: () => Promise<string | null>;
};

function mapFirebaseUserToMock(user: User | null): MockUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
    app_metadata: {},
    user_metadata: {
      email: user.email,
      name: user.displayName,
      avatar_url: user.photoURL,
    },
  };
}

function createMockSession(user: User): MockSession {
  return {
    user: { id: user.uid, email: user.email },
    access_token: 'firebase-token',
  };
}

export function useRequireAuth(): RequireAuthResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<'unknown' | 'refreshing' | 'authed' | 'loggedOut'>('unknown');
  const redirectingRef = useRef(false);
  const identifiedRef = useRef<string | null>(null);
  const tagsSignatureRef = useRef<string | null>(null);
  const forcedClarityOptOutRef = useRef(false);
  const initialResolvedRef = useRef(false);
  const lastKnownUserIdRef = useRef<string | null>(null);

  // Initialize with last known user ID
  useEffect(() => {
    lastKnownUserIdRef.current = readLastKnownUserId();
  }, []);

  const nextPath = useMemo(() => {
    const base = pathname ?? '/app';
    const search = searchParams?.toString();
    return search ? `${base}?${search}` : base;
  }, [pathname, searchParams]);

  const redirectToLogin = useCallback(() => {
    if (redirectingRef.current) return;
    if (consumeLogoutIntent()) {
      redirectingRef.current = true;
      router.replace('/');
      setTimeout(() => {
        redirectingRef.current = false;
      }, 100);
      return;
    }
    redirectingRef.current = true;
    const target =
      nextPath && nextPath !== '/login' ? `/login?next=${encodeURIComponent(nextPath)}` : '/login';
    router.replace(target);
  }, [router, nextPath]);

  // Main Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (user) {
        setAuthStatus('authed');
        lastKnownUserIdRef.current = user.uid;
        writeLastKnownUserId(user.uid);
      } else {
        // Check if we had a previous user - this is a sign out
        if (lastKnownUserIdRef.current || initialResolvedRef.current) {
          setAuthStatus('loggedOut');
          lastKnownUserIdRef.current = null;
          clearLastKnownAccount();
          writeLastKnownUserId(null);
          redirectToLogin();
        } else {
          // No previous user and no current user on initial load
          setAuthStatus('loggedOut');
          redirectToLogin();
        }
      }

      if (!initialResolvedRef.current) {
        setLoading(false);
        initialResolvedRef.current = true;
      }
    });

    return () => unsubscribe();
  }, [redirectToLogin]);

  // Clarity tracking
  useEffect(() => {
    const userId = firebaseUser?.uid ?? null;
    if (!userId) {
      identifiedRef.current = null;
      tagsSignatureRef.current = null;
      return;
    }

    const email = firebaseUser?.email ?? undefined;
    const isInternal = Boolean(email && /@maxvideoai\.(com|ai)$/i.test(email));

    if (isInternal) {
      if (!forcedClarityOptOutRef.current) {
        disableClarityForVisitor();
        forcedClarityOptOutRef.current = true;
      }
    } else if (forcedClarityOptOutRef.current) {
      enableClarityForVisitor();
      forcedClarityOptOutRef.current = false;
    }

    if (!isClarityEnabledForRuntime()) return;
    if (isInternal) return;

    if (identifiedRef.current !== userId) {
      identifiedRef.current = userId;
      queueClarityCommand('identify', userId);
    }

    const tags: Record<string, string> = {};
    tags.auth_state = 'signed_in';
    tags.user_uuid = userId;
    if (isInternal) tags.internal = 'true';

    const visitor = ensureClarityVisitorId();
    if (visitor) {
      tags.visitor = visitor;
    }

    const serialized = JSON.stringify(tags);
    if (tagsSignatureRef.current !== serialized) {
      tagsSignatureRef.current = serialized;
      Object.entries(tags).forEach(([key, value]) => {
        queueClarityCommand('set', key, value);
      });
    }
  }, [firebaseUser]);

  const user = useMemo(() => mapFirebaseUserToMock(firebaseUser), [firebaseUser]);
  const session = useMemo(() => firebaseUser ? createMockSession(firebaseUser) : null, [firebaseUser]);

  // Get the real Firebase ID token for API calls
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch (error) {
      console.error('[useRequireAuth] Failed to get ID token:', error);
      return null;
    }
  }, [firebaseUser]);

  return {
    userId: firebaseUser?.uid ?? lastKnownUserIdRef.current ?? null,
    user,
    session,
    loading,
    authStatus,
    getIdToken,
  };
}
