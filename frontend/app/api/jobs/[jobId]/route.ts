import { NextRequest, NextResponse } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { getJobById, isFirestoreConfigured } from '@/lib/firestore-db';
import { isDatabaseConfigured, query } from '@/lib/db';
import { normalizeMediaUrl } from '@/lib/media';
import type { PricingSnapshot } from '@/types/engines';

export const dynamic = 'force-dynamic';

function json(body: unknown, init?: Parameters<typeof NextResponse.json>[1]) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

type JobRow = {
  job_id: string;
  engine_id: string | null;
  engine_label: string;
  duration_sec: number;
  prompt: string;
  thumb_url: string | null;
  video_url: string | null;
  created_at: string;
  aspect_ratio: string | null;
  has_audio: boolean | null;
  can_upscale: boolean | null;
  preview_frame: string | null;
  final_price_cents: number | null;
  pricing_snapshot: PricingSnapshot | null;
  currency: string | null;
  vendor_account_id: string | null;
  payment_status: string | null;
  batch_id: string | null;
  group_id: string | null;
  iteration_index: number | null;
  iteration_count: number | null;
  render_ids: unknown;
  hero_render_id: string | null;
  local_key: string | null;
  message: string | null;
  eta_seconds: number | null;
  eta_label: string | null;
  status: string | null;
  progress: number | null;
};

async function getJobFromPostgres(jobId: string, userId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const rows = await query<JobRow>(
      `SELECT job_id, engine_id, engine_label, duration_sec, prompt, thumb_url, video_url, created_at, aspect_ratio,
              has_audio, can_upscale, preview_frame, final_price_cents, pricing_snapshot, currency, vendor_account_id,
              payment_status, batch_id, group_id, iteration_index, iteration_count, render_ids, hero_render_id,
              local_key, message, eta_seconds, eta_label, status, progress
         FROM app_jobs
        WHERE job_id = $1 AND user_id = $2 AND hidden IS NOT TRUE
        LIMIT 1`,
      [jobId, userId]
    );

    if (!rows.length) {
      return null;
    }

    const row = rows[0];
    return {
      jobId: row.job_id,
      engineId: row.engine_id ?? undefined,
      engineLabel: row.engine_label,
      durationSec: row.duration_sec,
      prompt: row.prompt,
      thumbUrl: normalizeMediaUrl(row.thumb_url) ?? undefined,
      videoUrl: normalizeMediaUrl(row.video_url ?? undefined) ?? undefined,
      createdAt: row.created_at,
      aspectRatio: row.aspect_ratio ?? undefined,
      hasAudio: row.has_audio ?? false,
      canUpscale: row.can_upscale ?? false,
      previewFrame: normalizeMediaUrl(row.preview_frame ?? undefined) ?? undefined,
      status: row.status ?? undefined,
      progress: row.progress ?? undefined,
      message: row.message ?? undefined,
      paymentStatus: row.payment_status ?? undefined,
      finalPriceCents: row.final_price_cents ?? undefined,
      currency: row.currency ?? 'USD',
      pricingSnapshot: row.pricing_snapshot ?? undefined,
      batchId: row.batch_id ?? undefined,
      groupId: row.group_id ?? undefined,
      iterationIndex: row.iteration_index ?? undefined,
      iterationCount: row.iteration_count ?? undefined,
      renderIds: Array.isArray(row.render_ids)
        ? row.render_ids.filter((value): value is string => typeof value === 'string')
        : undefined,
      heroRenderId: row.hero_render_id ?? undefined,
      localKey: row.local_key ?? undefined,
      etaSeconds: row.eta_seconds ?? undefined,
      etaLabel: row.eta_label ?? undefined,
    };
  } catch (error) {
    console.error(`[api/jobs] Postgres query failed for job ${jobId}:`, error);
    return null;
  }
}

async function getJobFromFirestore(jobId: string, userId: string, allowPublic = false) {
  if (!isFirestoreConfigured()) {
    return null;
  }

  try {
    // First try with user ownership check
    let job = await getJobById(jobId, userId);

    // If not found and allowPublic, try without userId filter for demo/public jobs
    if (!job && allowPublic) {
      job = await getJobById(jobId);
    }

    if (!job) {
      return null;
    }

    // Convert Firestore timestamp to ISO string
    let createdAt: string;
    if (job.createdAt instanceof Date) {
      createdAt = job.createdAt.toISOString();
    } else if (job.createdAt && typeof job.createdAt === 'object' && 'toDate' in job.createdAt) {
      createdAt = (job.createdAt as { toDate: () => Date }).toDate().toISOString();
    } else {
      createdAt = new Date().toISOString();
    }

    return {
      jobId: job.jobId,
      engineId: job.engineId,
      engineLabel: job.engineLabel,
      durationSec: job.durationSec,
      prompt: job.prompt,
      thumbUrl: job.thumbUrl ?? undefined,
      videoUrl: job.videoUrl ?? undefined,
      createdAt,
      aspectRatio: job.aspectRatio ?? undefined,
      hasAudio: job.hasAudio ?? false,
      canUpscale: job.canUpscale ?? false,
      previewFrame: job.previewFrame ?? undefined,
      status: job.status ?? undefined,
      progress: job.progress ?? undefined,
      message: job.message ?? undefined,
      paymentStatus: job.paymentStatus ?? undefined,
      finalPriceCents: job.finalPriceCents ?? undefined,
      currency: job.currency ?? 'USD',
      pricingSnapshot: undefined,
      batchId: job.batchId ?? undefined,
      groupId: job.groupId ?? undefined,
      iterationIndex: job.iterationIndex ?? undefined,
      iterationCount: job.iterationCount ?? undefined,
      renderIds: job.renderIds ?? undefined,
      heroRenderId: job.heroRenderId ?? undefined,
      localKey: job.localKey ?? undefined,
      etaSeconds: job.etaSeconds ?? undefined,
      etaLabel: job.etaLabel ?? undefined,
    };
  } catch (error) {
    console.error(`[api/jobs] Firestore query failed for job ${jobId}:`, error);
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId;

  const { userId } = await getRouteAuthContext(_req);

  if (!userId) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check if any database is configured
  const hasPostgres = isDatabaseConfigured();
  const hasFirestore = isFirestoreConfigured();

  if (!hasPostgres && !hasFirestore) {
    return json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    // Try Postgres first (where most video jobs are stored)
    let job = await getJobFromPostgres(jobId, userId);

    // Fall back to Firestore (for image jobs)
    if (!job) {
      // Allow public/demo jobs to be fetched without strict ownership
      job = await getJobFromFirestore(jobId, userId, true);
    }

    if (!job) {
      return json({ ok: false, error: 'Job not found' }, { status: 404 });
    }

    return json({
      ok: true,
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      videoUrl: job.videoUrl,
      thumbUrl: job.thumbUrl,
      aspectRatio: job.aspectRatio,
      pricing: job.pricingSnapshot,
      finalPriceCents: job.finalPriceCents,
      currency: job.currency,
      paymentStatus: job.paymentStatus,
      batchId: job.batchId,
      groupId: job.groupId,
      iterationIndex: job.iterationIndex,
      iterationCount: job.iterationCount,
      renderIds: job.renderIds,
      heroRenderId: job.heroRenderId,
      localKey: job.localKey,
      message: job.message,
      etaSeconds: job.etaSeconds,
      etaLabel: job.etaLabel,
    });
  } catch (error) {
    console.error(`[api/jobs] Error fetching job ${jobId}:`, error);
    return json({ ok: false, error: 'Database error' }, { status: 500 });
  }
}
