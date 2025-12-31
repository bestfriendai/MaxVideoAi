import { NextRequest, NextResponse } from 'next/server';
import { computeConfiguredPreflight } from '@/server/engines';
import { fetchFromFirebase } from '@/lib/firebase-backend';
import { ENV } from '@/lib/env';

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });

  if (ENV.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL) {
    try {
      const res = await fetchFromFirebase('preflight', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return NextResponse.json(res, { status: res.ok ? 200 : 400 });
    } catch (error) {
      console.warn('Failed to call preflight in Firebase, falling back to local:', error);
    }
  }

  const res = await computeConfiguredPreflight(payload);
  const status = res.ok ? 200 : 400;
  return NextResponse.json(res, { status });
}
