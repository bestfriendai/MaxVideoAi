import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/admin';
import { getFirebaseAuth, isFirebaseAdminConfigured } from '@/server/firebase-admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FIREBASE_ADMIN_NOT_CONFIGURED',
        message: 'Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
      },
      { status: 200 }
    );
  }

  const url = new URL(req.url);
  const search = (url.searchParams.get('search') ?? '').toLowerCase();
  const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get('perPage') ?? '25')));

  try {
    const auth = getFirebaseAuth();
    const result = await auth.listUsers(perPage);

    const users = result.users.filter((user) => {
      if (!search) return true;
      const email = (user.email ?? '').toLowerCase();
      const id = (user.uid ?? '').toLowerCase();
      return email.includes(search) || id.includes(search);
    });

    const payload = users.map((user) => ({
      id: user.uid,
      email: user.email,
      createdAt: user.metadata.creationTime,
      lastSignInAt: user.metadata.lastSignInTime,
      appMetadata: user.customClaims ?? {},
      userMetadata: {
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      factors: user.multiFactor?.enrolledFactors?.length ?? 0,
    }));

    const hasMore = result.pageToken !== undefined;

    return NextResponse.json({
      ok: true,
      users: payload,
      pagination: {
        perPage,
        nextPageToken: result.pageToken ?? null,
        hasMore,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
