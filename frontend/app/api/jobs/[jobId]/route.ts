import { NextRequest, NextResponse } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { getJobById, isFirestoreConfigured } from '@/lib/firestore-db';

export const dynamic = 'force-dynamic';

function json(body: unknown, init?: Parameters<typeof NextResponse.json>[1]) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId;

  const { userId } = await getRouteAuthContext(_req);

  if (!userId) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const job = await getJobById(jobId, userId);

    if (!job) {
      return json({ ok: false, error: 'Job not found' }, { status: 404 });
    }

    // Convert Firestore timestamp to ISO string
    const createdAt = job.createdAt instanceof Date
      ? job.createdAt.toISOString()
      : (job.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString();

    return json({
      ok: true,
      job: {
        jobId: job.jobId,
        engineId: job.engineId,
        engineLabel: job.engineLabel,
        durationSec: job.durationSec,
        prompt: job.prompt,
        thumbUrl: job.thumbUrl,
        videoUrl: job.videoUrl,
        createdAt,
        aspectRatio: job.aspectRatio,
        hasAudio: job.hasAudio ?? false,
        canUpscale: job.canUpscale ?? false,
        previewFrame: job.previewFrame,
        status: job.status,
        progress: job.progress,
        message: job.message,
        paymentStatus: job.paymentStatus,
        finalPriceCents: job.finalPriceCents,
        currency: job.currency ?? 'USD',
        batchId: job.batchId,
        groupId: job.groupId,
        iterationIndex: job.iterationIndex,
        iterationCount: job.iterationCount,
        renderIds: job.renderIds,
        heroRenderId: job.heroRenderId,
        localKey: job.localKey,
        etaSeconds: job.etaSeconds,
        etaLabel: job.etaLabel,
      }
    });
  } catch (error) {
    console.error(`[api/jobs] Error fetching job ${jobId}:`, error);
    return json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}
