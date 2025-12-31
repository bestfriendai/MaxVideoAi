'use client';

// This file is deprecated - use firebase-auth.ts instead
// Keeping for backward compatibility during migration

import { auth } from '@/lib/firebase-client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getIdToken, getCurrentUserId, signOut as firebaseSignOut } from '@/lib/firebase-auth';

// Re-export Firebase auth for backward compatibility
export const supabase = {
  auth: {
    getSession: async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await getIdToken();
        return {
          data: {
            session: {
              user: { id: user.uid, email: user.email },
              access_token: token,
            },
          },
          error: null,
        };
      }
      return { data: { session: null }, error: null };
    },

    getUser: async () => {
      const user = auth.currentUser;
      if (user) {
        return {
          data: {
            user: {
              id: user.uid,
              email: user.email,
            },
          },
          error: null,
        };
      }
      return { data: { user: null }, error: { message: 'No user' } };
    },

    signOut: async () => {
      await firebaseSignOut();
      return { error: null };
    },

    onAuthStateChange: (callback: (event: string, session: { user: { id: string; email: string | null }; access_token: string | null } | null) => void) => {
      // Use Firebase's onAuthStateChanged
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          const token = await user.getIdToken().catch(() => null);
          callback('SIGNED_IN', {
            user: { id: user.uid, email: user.email },
            access_token: token,
          });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return { data: { subscription: { unsubscribe } } };
    },
  },
};

// Export utilities
export { getIdToken, getCurrentUserId };
