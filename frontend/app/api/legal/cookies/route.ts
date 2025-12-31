import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getLegalDocumentUncached } from '@/lib/legal';
import { recordUserConsents } from '@/server/legal-consents';
import { getRouteAuthContext } from '@/lib/supabase-ssr';

export const runtime = 'nodejs';

type ConsentBody = {
  version?: string;
  categories?: Record<string, boolean>;
};

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export async function POST(req: NextRequest) {
  let body: ConsentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const doc = await getLegalDocumentUncached('cookies');
  if (!doc) {
    if (process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL) {
      // Fallback for dev mode without DB
      const fallbackDoc = { version: '1.0' };
      // We continue with fallbackDoc
      // But we need to define 'doc' variable to use below
      // Since 'doc' is const in original scope (wait, no it's const in the block above in my replacement?)
      // I need to restructure the code slightly or just use a new variable.
      // Actually, I can just not return 500.
    } else {
      return NextResponse.json({ ok: false, error: 'Cookie policy not configured' }, { status: 500 });
    }
  }

  const effectiveVersion = doc?.version ?? '1.0';

  const categories = {
    analytics: normalizeBoolean(body.categories?.analytics),
    ads: normalizeBoolean(body.categories?.ads),
  };

  try {
    const { userId } = await getRouteAuthContext(req);
    if (userId) {
      await recordUserConsents({
        userId,
        entries: [
          { docKey: 'cookies', docVersion: effectiveVersion, accepted: true, source: 'cookie_banner' },
          { docKey: 'cookies.analytics', docVersion: effectiveVersion, accepted: categories.analytics, source: 'cookie_banner' },
          { docKey: 'cookies.ads', docVersion: effectiveVersion, accepted: categories.ads, source: 'cookie_banner' },
        ],
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: req.headers.get('user-agent'),
        defaultSource: 'cookie_banner',
      });
    }

    return NextResponse.json({ ok: true, version: effectiveVersion });
  } catch (error) {
    console.error('[legal-cookies] failed to record consent', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to record consent' },
      { status: 500 }
    );
  }
}
