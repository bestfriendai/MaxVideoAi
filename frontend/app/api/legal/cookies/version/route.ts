import { NextResponse } from 'next/server';
import { getLegalDocumentUncached } from '@/lib/legal';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const doc = await getLegalDocumentUncached('cookies');
    if (!doc) {
      if (process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL) {
        return NextResponse.json({
          ok: true,
          version: '1.0',
          publishedAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ ok: false, error: 'Cookie policy not configured' }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      version: doc.version,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    });
  } catch (error) {
    console.error('[legal-cookies] version lookup failed', error);
    return NextResponse.json({ ok: false, error: 'Failed to load cookie policy version' }, { status: 500 });
  }
}
