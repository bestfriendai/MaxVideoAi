import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_NEXT_PATH = '/app';

function sanitizeNextPath(value: string | null): string {
  if (!value) return DEFAULT_NEXT_PATH;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return DEFAULT_NEXT_PATH;
  if (trimmed.startsWith('/login') || trimmed.startsWith('/api') || trimmed.startsWith('/_next')) {
    return DEFAULT_NEXT_PATH;
  }
  return trimmed;
}

// Firebase Auth: OAuth callbacks are handled client-side by Firebase SDK
// This route just handles redirects for backward compatibility
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const nextParam = requestUrl.searchParams.get('next');
  const nextPath = sanitizeNextPath(nextParam);

  // Firebase handles OAuth callbacks internally via signInWithPopup/signInWithRedirect
  // Just redirect to the intended destination
  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
