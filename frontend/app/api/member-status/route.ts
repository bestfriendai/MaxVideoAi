import { NextRequest, NextResponse } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { getMemberStatus, isFirestoreConfigured } from '@/lib/firestore-db';

export const dynamic = 'force-dynamic';

function json(body: unknown, init?: Parameters<typeof NextResponse.json>[1]) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function GET(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);

  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  const includeTiers = (() => {
    try {
      const param = req.nextUrl.searchParams.get('includeTiers');
      if (!param) return false;
      return param === '1' || param.toLowerCase() === 'true';
    } catch {
      return false;
    }
  })();

  try {
    const status = await getMemberStatus(userId);

    const response: Record<string, unknown> = {
      tier: status.tier,
      savingsPct: status.savingsPct,
      spent30: status.spent30,
      spentToday: status.spentToday,
    };

    if (includeTiers) {
      response.tiers = [
        { tier: 'member', spendThresholdCents: 0, discountPercent: 0 },
        { tier: 'silver', spendThresholdCents: 5000, discountPercent: 0.05 },
        { tier: 'gold', spendThresholdCents: 10000, discountPercent: 0.10 },
      ];
    }

    return json(response);
  } catch (error) {
    console.error('[api/member-status] failed:', error);
    return json({ error: 'Member status lookup failed' }, { status: 500 });
  }
}
