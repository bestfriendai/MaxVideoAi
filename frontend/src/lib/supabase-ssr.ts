import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/server/firebase-admin';

// Firebase Server Auth - Replaces Supabase SSR
// This module handles server-side token verification using Firebase Admin SDK

export type AuthContext = {
  userId: string | null;
  userEmail: string | null;
};

/**
 * Get authenticated user from request Authorization header
 * Uses Firebase Admin SDK to verify the ID token
 */
export async function getRouteAuthContext(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;
  let userEmail: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const verified = await verifyIdToken(token);
      if (verified) {
        userId = verified.uid;
        userEmail = verified.email ?? null;
      }
    } catch (e) {
      console.error('[Auth] Firebase token verification failed:', e);
    }
  }

  return { userId, userEmail };
}

/**
 * Middleware session update - extracts user from Firebase token
 */
export async function updateSession(req: NextRequest, _res: NextResponse) {
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const verified = await verifyIdToken(token);
    userId = verified?.uid ?? null;
  }

  return { userId, error: null };
}

/**
 * Create a mock Supabase-like client for backward compatibility
 * This allows gradual migration of code that still uses Supabase patterns
 * @deprecated Use getRouteAuthContext instead
 */
export function createSupabaseRouteClient() {
  console.warn('[DEPRECATED] createSupabaseRouteClient is deprecated. Use getRouteAuthContext instead.');
  return {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: { message: 'Use Firebase auth instead' },
      }),
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
    },
  };
}

/**
 * @deprecated Use getRouteAuthContext instead
 */
export function createSupabaseServerClient() {
  console.warn('[DEPRECATED] createSupabaseServerClient is deprecated. Use getRouteAuthContext instead.');
  return createSupabaseRouteClient();
}

/**
 * @deprecated Use getRouteAuthContext instead
 */
export function createSupabaseMiddlewareClient(_req: NextRequest, _res: NextResponse) {
  console.warn('[DEPRECATED] createSupabaseMiddlewareClient is deprecated.');
  return createSupabaseRouteClient();
}
