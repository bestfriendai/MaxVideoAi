'use client';

import { auth } from '@/lib/firebase-client';
import { onAuthStateChanged, type User } from 'firebase/auth';

// Firebase Auth utilities - replaces all Supabase auth

export type FirebaseUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type AuthSession = {
  user: FirebaseUser;
  accessToken: string;
};

// Get current user synchronously (may be null if not yet initialized)
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Get current user ID
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

// Get Firebase ID token for API calls
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('[firebase-auth] Failed to get ID token:', error);
    return null;
  }
}

// Convert Firebase User to our user type
export function mapFirebaseUser(user: User | null): FirebaseUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

// Get current session with token
export async function getSession(): Promise<AuthSession | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const accessToken = await user.getIdToken();
    return {
      user: mapFirebaseUser(user)!,
      accessToken,
    };
  } catch {
    return null;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await auth.signOut();
}

// Subscribe to auth state changes
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(mapFirebaseUser(firebaseUser));
  });
}

// Wait for auth to be initialized
export function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser !== undefined) {
      // Auth already initialized
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    } else {
      resolve(auth.currentUser);
    }
  });
}

// Re-export auth instance
export { auth };
