import { NextRequest, NextResponse } from 'next/server';
import {
  decodeImpersonationSessionCookie,
  decodeImpersonationTargetCookie,
  impersonationCookieNames,
  impersonationCookieOptions,
  sanitizeRelativePath,
} from '@/lib/admin/impersonation';
import { logAdminAction } from '@/server/admin-audit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get(impersonationCookieNames.session)?.value ?? null;
  const sessionPayload = decodeImpersonationSessionCookie(sessionCookie);
  if (!sessionPayload) {
    return NextResponse.json({ ok: false, error: 'No active impersonation session' }, { status: 400 });
  }

  // Firebase Auth: Session restoration is handled client-side
  // We just clear the impersonation cookies and redirect
  // The client-side Firebase auth will maintain the admin's actual session

  const redirectParam = req.nextUrl.searchParams.get('redirect');
  const redirectTo =
    sanitizeRelativePath(redirectParam) ?? sanitizeRelativePath(sessionPayload.returnTo) ?? '/admin';

  const response = NextResponse.redirect(new URL(redirectTo, req.url));
  const options = impersonationCookieOptions();
  response.cookies.set(impersonationCookieNames.session, '', { ...options, maxAge: 0 });
  response.cookies.set(impersonationCookieNames.target, '', { ...options, maxAge: 0 });

  const targetPayload = decodeImpersonationTargetCookie(req.cookies.get(impersonationCookieNames.target)?.value ?? null);
  await logAdminAction({
    adminId: sessionPayload.adminId,
    targetUserId: targetPayload?.userId ?? null,
    action: 'IMPERSONATE_STOP',
    route: '/api/admin/impersonate/exit',
    metadata: { redirectTo },
  });

  return response;
}
