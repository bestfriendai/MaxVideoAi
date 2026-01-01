export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { isDatabaseConfigured, query } from '@/lib/db';
import { normalizeMediaUrl } from '@/lib/media';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import type { PricingSnapshot } from '@/types/engines';
import type { Job } from '@/types/jobs';

function toJob(row: JobRow): Job {
  return {
    jobId: row.job_id,
    engineLabel: row.engine_label,
    durationSec: row.duration_sec,
    prompt: row.prompt,
    thumbUrl: normalizeMediaUrl(row.thumb_url) ?? undefined,
    videoUrl: normalizeMediaUrl(row.video_url ?? undefined) ?? undefined,
    createdAt: row.created_at,
    engineId: row.engine_id ?? undefined,
    aspectRatio: row.aspect_ratio ?? undefined,
    hasAudio: row.has_audio ?? undefined,
    canUpscale: row.can_upscale ?? undefined,
    previewFrame: normalizeMediaUrl(row.preview_frame ?? undefined) ?? undefined,
    batchId: row.batch_id ?? undefined,
    groupId: row.group_id ?? undefined,
    iterationIndex: row.iteration_index ?? undefined,
    iterationCount: row.iteration_count ?? undefined,
    renderIds: Array.isArray(row.render_ids)
      ? row.render_ids.filter((value): value is string => typeof value === 'string')
      : undefined,
    heroRenderId: row.hero_render_id ?? undefined,
    localKey: row.local_key ?? undefined,
    status: row.status ?? undefined,
    progress: row.progress ?? undefined,
    message: row.message ?? undefined,
    etaSeconds: row.eta_seconds ?? undefined,
    etaLabel: row.eta_label ?? undefined,
    finalPriceCents: row.final_price_cents ?? undefined,
    currency: row.currency ?? undefined,
    pricingSnapshot: row.pricing_snapshot ?? undefined,
    vendorAccountId: row.vendor_account_id ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
  };
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

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return new Response('Database unavailable', { status: 503 });
  }

  const { userId } = await getRouteAuthContext(req);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20')));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      const push = async () => {
        if (!active) return;
        const rows = await query<JobRow>(
          `SELECT job_id, engine_id, engine_label, duration_sec, prompt, thumb_url, video_url, created_at, aspect_ratio,
                  has_audio, can_upscale, preview_frame, final_price_cents, pricing_snapshot, currency, vendor_account_id,
                  payment_status, batch_id, group_id, iteration_index, iteration_count, render_ids, hero_render_id,
                  local_key, message, eta_seconds, eta_label, status, progress
             FROM app_jobs
            WHERE user_id = $1
              AND hidden IS NOT TRUE
            ORDER BY updated_at DESC
            LIMIT $2`,
          [userId, limit]
        );

        const payload = JSON.stringify({ jobs: rows.map(toJob) });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      try {
        await push();
      } catch {
        // ignore initial push errors; retry on next tick
      }

      const interval = setInterval(() => {
        void push();
      }, 2000);

      const closeStream = () => {
        if (!active) return;
        active = false;
        clearInterval(interval);
        controller.close();
      };

      req.signal.addEventListener('abort', closeStream);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
