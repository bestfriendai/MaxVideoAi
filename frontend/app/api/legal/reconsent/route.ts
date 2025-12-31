import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { isFirestoreConfigured, getDb } from '@/lib/firestore-db';

export const runtime = 'nodejs';

type LegalDocumentKey = 'terms' | 'privacy' | 'cookies';
type ReconsentMode = 'soft' | 'hard';

type DocumentStatus = {
  key: LegalDocumentKey;
  currentVersion: string;
  publishedAt: string | null;
  acceptedVersion: string | null;
};

function resolveMode(): ReconsentMode {
  const mode = (process.env.LEGAL_RECONSENT_MODE ?? 'soft').toLowerCase();
  return mode === 'hard' ? 'hard' : 'soft';
}

// Current versions of legal documents
const CURRENT_VERSIONS: Record<LegalDocumentKey, { version: string; publishedAt: Date }> = {
  terms: { version: '1.0.0', publishedAt: new Date('2024-01-01') },
  privacy: { version: '1.0.0', publishedAt: new Date('2024-01-01') },
  cookies: { version: '1.0.0', publishedAt: new Date('2024-01-01') },
};

async function fetchUserConsents(userId: string): Promise<Record<LegalDocumentKey, string | null>> {
  const latest: Record<LegalDocumentKey, string | null> = {
    terms: null,
    privacy: null,
    cookies: null,
  };

  if (!isFirestoreConfigured()) {
    return latest;
  }

  try {
    const db = getDb();
    const snapshot = await db.collection('userConsents')
      .where('userId', '==', userId)
      .orderBy('acceptedAt', 'desc')
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docKey = data.docKey as LegalDocumentKey;
      if ((docKey === 'terms' || docKey === 'privacy' || docKey === 'cookies') && !latest[docKey]) {
        latest[docKey] = data.docVersion as string;
      }
    }
  } catch (error) {
    console.warn('[legal-reconsent] failed to load consent history', error);
  }

  return latest;
}

async function recordUserConsent(params: {
  userId: string;
  docKey: LegalDocumentKey;
  docVersion: string;
}): Promise<void> {
  if (!isFirestoreConfigured()) return;

  try {
    const db = getDb();
    await db.collection('userConsents').add({
      userId: params.userId,
      docKey: params.docKey,
      docVersion: params.docVersion,
      acceptedAt: new Date(),
    });
  } catch (error) {
    console.warn('[legal-reconsent] failed to record consent', error);
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);

  if (!userId) {
    // Return default "no reconsent needed" when not authenticated
    return NextResponse.json({
      ok: true,
      needsReconsent: false,
      shouldBlock: false,
      mode: 'soft',
      graceEndsAt: null,
      documents: [],
    });
  }

  try {
    const mode = resolveMode();
    const latestConsents = await fetchUserConsents(userId);

    const mismatches: DocumentStatus[] = [];
    for (const key of ['terms', 'privacy', 'cookies'] as LegalDocumentKey[]) {
      const current = CURRENT_VERSIONS[key];
      const accepted = latestConsents[key];
      if (accepted !== current.version) {
        mismatches.push({
          key,
          currentVersion: current.version,
          publishedAt: current.publishedAt.toISOString(),
          acceptedVersion: accepted,
        });
      }
    }

    if (mismatches.length === 0) {
      return NextResponse.json({
        ok: true,
        needsReconsent: false,
        shouldBlock: false,
        mode,
        graceEndsAt: null,
        documents: [],
      });
    }

    return NextResponse.json({
      ok: true,
      needsReconsent: true,
      shouldBlock: mode === 'hard',
      mode,
      graceEndsAt: null,
      documents: mismatches,
    });
  } catch (error) {
    console.error('[legal-reconsent] status check failed', error);
    return NextResponse.json({
      ok: true,
      needsReconsent: false,
      shouldBlock: false,
      mode: 'soft',
      graceEndsAt: null,
      documents: [],
    });
  }
}

type PostBody = {
  documents?: LegalDocumentKey[];
};

export async function POST(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: PostBody = {};
  try {
    body = await req.json();
  } catch {
    // ignore: optional body
  }

  try {
    const documentsToAccept = body.documents ?? ['terms', 'privacy', 'cookies'];

    for (const docKey of documentsToAccept) {
      if (docKey === 'terms' || docKey === 'privacy' || docKey === 'cookies') {
        await recordUserConsent({
          userId,
          docKey,
          docVersion: CURRENT_VERSIONS[docKey].version,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      needsReconsent: false,
      shouldBlock: false,
      mode: resolveMode(),
      graceEndsAt: null,
      documents: [],
    });
  } catch (error) {
    console.error('[legal-reconsent] acceptance failed', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to record consent' },
      { status: 500 }
    );
  }
}
