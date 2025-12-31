'use client';

import { auth } from '@/lib/firebase-client';

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export async function authFetch(input: FetchInput, init?: FetchInit): Promise<Response> {
  let token: string | null = null;
  try {
    const user = auth.currentUser;
    if (user) {
      token = await user.getIdToken();
    }
  } catch (e) {
    console.warn("Failed to get firebase token", e);
    token = null;
  }

  const headers = new Headers(init?.headers ?? {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Firebase auth tokens are sent as Bearer tokens. 
  // 'credentials: include' is for cookies, which we might not need if we are token based,
  // but keeping it doesn't hurt for other cookies.
  const credentials = init?.credentials ?? 'include';

  return fetch(input, {
    ...init,
    headers,
    credentials,
  });
}
