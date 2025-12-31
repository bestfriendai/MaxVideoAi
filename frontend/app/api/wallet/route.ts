import { NextRequest, NextResponse } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { getWalletBalance, ensureWalletInitialized, isFirestoreConfigured } from '@/lib/firestore-db';

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

  try {
    // Ensure user has wallet initialized with welcome bonus
    await ensureWalletInitialized(userId);

    const { balance, currency } = await getWalletBalance(userId);

    return json({
      balance,
      currency,
      settlementCurrency: 'USD',
    });
  } catch (error) {
    console.error('[wallet] Error fetching balance:', error);
    return json({ error: 'Wallet lookup failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);

  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  // For now, top-ups are handled via Stripe checkout
  // This endpoint could be extended to support direct wallet operations
  return json({ error: 'Top-up via this endpoint not supported. Use Stripe checkout.' }, { status: 400 });
}
