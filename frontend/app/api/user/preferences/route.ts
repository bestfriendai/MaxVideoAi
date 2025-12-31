import { NextRequest, NextResponse } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { getUserPreferences, updateUserPreferences, isFirestoreConfigured } from '@/lib/firestore-db';

export async function GET(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const prefs = await getUserPreferences(userId);
    return NextResponse.json({
      ok: true,
      preferences: {
        defaultSharePublic: prefs.defaultSharePublic,
        defaultAllowIndex: prefs.defaultAllowIndex,
        onboardingDone: prefs.onboardingDone,
      }
    });
  } catch (error) {
    console.error('[api/user/preferences] failed', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, boolean> = {};

    if (typeof body?.defaultSharePublic === 'boolean') {
      updates.defaultSharePublic = body.defaultSharePublic;
    }
    if (typeof body?.defaultAllowIndex === 'boolean') {
      updates.defaultAllowIndex = body.defaultAllowIndex;
    }
    if (typeof body?.onboardingDone === 'boolean') {
      updates.onboardingDone = body.onboardingDone;
    }

    const prefs = await updateUserPreferences(userId, updates);
    return NextResponse.json({
      ok: true,
      preferences: {
        defaultSharePublic: prefs.defaultSharePublic,
        defaultAllowIndex: prefs.defaultAllowIndex,
        onboardingDone: prefs.onboardingDone,
      }
    });
  } catch (error) {
    console.error('[api/user/preferences] update failed', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
