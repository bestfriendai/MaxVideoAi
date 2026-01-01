import { NextRequest, NextResponse } from 'next/server';
import { adminErrorToResponse, requireAdmin } from '@/server/admin';
import { logAdminAction } from '@/server/admin-audit';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { getFirebaseAuth, isFirebaseAdminConfigured } from '@/server/firebase-admin';
import {
  encodeImpersonationSession,
  encodeImpersonationTarget,
  impersonationCookieNames,
  impersonationCookieOptions,
  sanitizeRelativePath,
} from '@/lib/admin/impersonation';

const WORKSPACE_REDIRECT = '/app';

export const runtime = 'nodejs';

type ImpersonatePayload = {
  userId?: string;
  redirectTo?: string;
  returnTo?: string;
};

async function parsePayload(req: NextRequest): Promise<ImpersonatePayload> {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null);
    if (body && typeof body === 'object') {
      return {
        userId: typeof body.userId === 'string' ? body.userId : undefined,
        redirectTo: typeof body.redirectTo === 'string' ? body.redirectTo : undefined,
        returnTo: typeof body.returnTo === 'string' ? body.returnTo : undefined,
      };
    }
    return {};
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    return {
      userId: typeof formData.get('userId') === 'string' ? (formData.get('userId') as string) : undefined,
      redirectTo: typeof formData.get('redirectTo') === 'string' ? (formData.get('redirectTo') as string) : undefined,
      returnTo: typeof formData.get('returnTo') === 'string' ? (formData.get('returnTo') as string) : undefined,
    };
  }
  return {};
}

function resolveRedirect(value: string | null | undefined, fallback: string): string {
  const sanitized = sanitizeRelativePath(value);
  return sanitized ?? fallback;
}

export async function POST(req: NextRequest) {
  let adminUserId: string;
  try {
    adminUserId = await requireAdmin(req);
  } catch (error) {
    return adminErrorToResponse(error);
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'FIREBASE_ADMIN_NOT_CONFIGURED', message: 'Firebase Admin SDK is not configured.' },
      { status: 501 }
    );
  }

  const payload = await parsePayload(req);
  const targetUserId = payload.userId?.trim();
  if (!targetUserId) {
    return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
  }

  const redirectTo = resolveRedirect(payload.redirectTo, WORKSPACE_REDIRECT);
  const returnTo = resolveRedirect(payload.returnTo, `/admin/users/${targetUserId}`);

  // Get admin's current auth context
  const { userId: currentAdminId } = await getRouteAuthContext(req);
  if (!currentAdminId) {
    return NextResponse.json({ ok: false, error: 'Admin session not found' }, { status: 400 });
  }

  // Verify target user exists
  const auth = getFirebaseAuth();
  let targetUser;
  try {
    targetUser = await auth.getUser(targetUserId);
  } catch {
    return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
  }

  const targetEmail = targetUser.email;
  if (!targetEmail) {
    return NextResponse.json({ ok: false, error: 'User has no email associated' }, { status: 400 });
  }

  // Create a custom token for impersonation
  // Note: The client will need to sign in with this custom token
  let customToken: string;
  try {
    customToken = await auth.createCustomToken(targetUserId, {
      impersonatedBy: adminUserId,
      impersonationStarted: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to create impersonation token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }

  // Return the custom token - client will use signInWithCustomToken
  const response = NextResponse.json({
    ok: true,
    customToken,
    redirectTo,
    targetUser: {
      id: targetUserId,
      email: targetEmail,
    },
  });

  const cookieOptions = impersonationCookieOptions();
  response.cookies.set(
    impersonationCookieNames.session,
    encodeImpersonationSession({
      adminId: adminUserId,
      accessToken: 'firebase-impersonation',
      refreshToken: '',
      returnTo,
    }),
    cookieOptions
  );
  response.cookies.set(
    impersonationCookieNames.target,
    encodeImpersonationTarget({
      userId: targetUserId,
      email: targetEmail,
      startedAt: new Date().toISOString(),
    }),
    cookieOptions
  );

  await logAdminAction({
    adminId: adminUserId,
    targetUserId,
    action: 'IMPERSONATE_START',
    route: '/api/admin/impersonate',
    metadata: { redirectTo, returnTo },
  });

  return response;
}
