export const runtime = 'nodejs';

import { ApiError, ValidationError } from '@fal-ai/client';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { listFalEngines } from '@/config/falEngines';
import type {
  GeneratedImage,
  ImageGenerationMode,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from '@/types/image-generation';
import { getFalClient } from '@/lib/fal-client';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { normalizeMediaUrl } from '@/lib/media';
import { getNanoBananaDefaultAspectRatio, normalizeNanoBananaAspectRatio } from '@/lib/image/aspectRatios';
import {
  isFirestoreConfigured,
  getWalletBalance,
  chargeWallet,
  refundWallet,
  createJob,
  updateJob,
  getUserPreferences,
  ensureWalletInitialized,
} from '@/lib/firestore-db';

const MAX_IMAGES = 8;
const PLACEHOLDER_THUMB = '/assets/frames/thumb-1x1.svg';
const NANO_BANANA_IMAGE_ENGINE_IDS = new Set(['nano-banana', 'nano-banana-pro']);

// Pricing: $0.05 per image for standard, $0.10 for pro
const PRICE_PER_IMAGE_CENTS = 5;
const PRICE_PER_IMAGE_PRO_CENTS = 10;

function normalizeFalResolution(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^\d+k$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

const IMAGE_ENGINE_REGISTRY = listFalEngines().filter((entry) => (entry.category ?? 'video') === 'image');
const IMAGE_ENGINE_MAP = new Map(IMAGE_ENGINE_REGISTRY.map((entry) => [entry.id, entry]));
const DEFAULT_IMAGE_ENGINE_ID = IMAGE_ENGINE_REGISTRY[0]?.id ?? null;

function getImageEngine(engineId?: string | null) {
  if (engineId && IMAGE_ENGINE_MAP.has(engineId)) {
    return IMAGE_ENGINE_MAP.get(engineId)!;
  }
  if (DEFAULT_IMAGE_ENGINE_ID && IMAGE_ENGINE_MAP.has(DEFAULT_IMAGE_ENGINE_ID)) {
    return IMAGE_ENGINE_MAP.get(DEFAULT_IMAGE_ENGINE_ID)!;
  }
  return null;
}

function normalizeMode(value: unknown, fallback: ImageGenerationMode = 't2i'): ImageGenerationMode {
  if (value === 't2i' || value === 'i2i') {
    return value;
  }
  if (value === 'generate') return 't2i';
  if (value === 'edit') return 'i2i';
  return fallback;
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.replace(/^\.?\/+/, '');
  return `https://fal.media/files/${normalized}`;
}

function extractImages(payload: unknown): GeneratedImage[] {
  const roots: unknown[] = [];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    roots.push(record);
    if (record.output && typeof record.output === 'object') roots.push(record.output);
    if (record.response && typeof record.response === 'object') roots.push(record.response);
    if (record.data && typeof record.data === 'object') roots.push(record.data);
  }

  for (const root of roots) {
    if (!root || typeof root !== 'object') continue;
    const imagesCandidate = (root as { images?: unknown }).images;
    if (!Array.isArray(imagesCandidate)) continue;
    const mapped = imagesCandidate.reduce<GeneratedImage[]>((acc, entry) => {
      if (!entry || typeof entry !== 'object') {
        return acc;
      }
      const record = entry as Record<string, unknown>;
      const urlRaw = typeof record.url === 'string' ? record.url : null;
      if (!urlRaw) {
        return acc;
      }
      const width = typeof record.width === 'number' ? record.width : null;
      const height = typeof record.height === 'number' ? record.height : null;
      const mime =
        typeof record.content_type === 'string'
          ? (record.content_type as string)
          : typeof record.mimetype === 'string'
            ? (record.mimetype as string)
            : null;
      acc.push({
        url: normalizeUrl(urlRaw),
        width,
        height,
        mimeType: mime,
      });
      return acc;
    }, []);
    if (mapped.length) {
      return mapped;
    }
  }
  return [];
}

function respondError(
  mode: ImageGenerationMode,
  code: string,
  message: string,
  status: number,
  detail?: unknown,
  extras?: Partial<ImageGenerationResponse>
) {
  const payload: ImageGenerationResponse = {
    ok: false,
    mode,
    images: [],
    ...extras,
    error: {
      code,
      message,
      detail,
    },
  };
  return NextResponse.json(payload, { status });
}

export async function POST(req: NextRequest) {
  let body: Partial<ImageGenerationRequest> | null = null;
  try {
    body = (await req.json()) as Partial<ImageGenerationRequest>;
  } catch {
    return respondError('t2i', 'invalid_payload', 'Payload must be valid JSON.', 400);
  }

  const { userId } = await getRouteAuthContext(req);
  if (!userId) {
    return respondError('t2i', 'auth_required', 'Authentication required.', 401);
  }

  if (!isFirestoreConfigured()) {
    return respondError('t2i', 'db_unavailable', 'Database not configured.', 503);
  }

  // Ensure user has wallet initialized
  await ensureWalletInitialized(userId);

  const engineEntry = getImageEngine(body?.engineId);
  if (!engineEntry) {
    return respondError('t2i', 'engine_unavailable', 'Image engine unavailable.', 503);
  }

  const engine = engineEntry.engine;
  const fallbackMode = (engineEntry.modes[0]?.mode as ImageGenerationMode | undefined) ?? 't2i';
  const mode = normalizeMode(body?.mode, fallbackMode);
  const modeConfig = engineEntry.modes.find((entry) => entry.mode === mode);
  if (!modeConfig?.falModelId) {
    return respondError(mode, 'mode_unsupported', 'Selected engine does not support this mode.', 400, null, {
      engineId: engineEntry.id,
      engineLabel: engineEntry.marketingName,
    });
  }

  const isNanoBanana = NANO_BANANA_IMAGE_ENGINE_IDS.has(engineEntry.id);
  const resolvedAspectRatio = isNanoBanana
    ? normalizeNanoBananaAspectRatio(mode, body?.aspectRatio) ?? getNanoBananaDefaultAspectRatio(mode)
    : null;

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt.length) {
    return respondError(mode, 'invalid_prompt', 'Prompt is required.', 400, null, {
      engineId: engineEntry.id,
      engineLabel: engineEntry.marketingName,
    });
  }

  const requestedImages =
    typeof body?.numImages === 'number' && Number.isFinite(body.numImages) ? Math.round(body.numImages) : 1;
  const numImages = Math.min(MAX_IMAGES, Math.max(1, requestedImages));

  const rawImageUrls = Array.isArray(body?.imageUrls) ? body.imageUrls : [];
  const imageUrls = rawImageUrls
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length);

  const jobId = `img_${randomUUID()}`;

  // Calculate pricing
  const isPro = engineEntry.id.includes('pro');
  const pricePerImage = isPro ? PRICE_PER_IMAGE_PRO_CENTS : PRICE_PER_IMAGE_CENTS;
  const totalCents = pricePerImage * numImages;

  // Check wallet balance and charge
  const { balance } = await getWalletBalance(userId);
  const balanceCents = Math.round(balance * 100);

  if (balanceCents < totalCents) {
    return respondError(mode, 'insufficient_funds', 'Insufficient wallet balance.', 402, {
      requiredCents: totalCents,
      balanceCents,
    });
  }

  // Charge wallet
  const chargeResult = await chargeWallet({
    userId,
    amountCents: totalCents,
    currency: 'USD',
    description: `${engineEntry.marketingName} – ${numImages} image${numImages > 1 ? 's' : ''}`,
    jobId,
  });

  if (!chargeResult.ok) {
    return respondError(mode, 'insufficient_funds', 'Insufficient wallet balance.', 402, {
      requiredCents: totalCents,
      balanceCents: chargeResult.balanceCents,
    });
  }

  // Get user preferences for visibility
  let defaultAllowIndex = true;
  try {
    const prefs = await getUserPreferences(userId);
    defaultAllowIndex = prefs.defaultAllowIndex;
  } catch (error) {
    console.warn('[images] unable to read user preferences', error);
  }

  const visibility = body?.visibility === 'public' ? 'public' : 'private';
  const indexable =
    typeof body?.allowIndex === 'boolean' ? body.allowIndex : typeof body?.indexable === 'boolean' ? body.indexable : defaultAllowIndex;

  // Create job record
  await createJob({
    jobId,
    userId,
    engineId: engine.id,
    engineLabel: engine.label,
    durationSec: numImages,
    prompt,
    thumbUrl: PLACEHOLDER_THUMB,
    videoUrl: null,
    aspectRatio: resolvedAspectRatio,
    hasAudio: false,
    canUpscale: Boolean(engine.upscale4k),
    previewFrame: PLACEHOLDER_THUMB,
    status: 'pending',
    progress: 0,
    message: null,
    paymentStatus: 'paid_wallet',
    finalPriceCents: totalCents,
    currency: 'USD',
    visibility,
    indexable,
  });

  // Prepare FAL request
  const falAspectRatio = resolvedAspectRatio && resolvedAspectRatio !== 'auto' ? resolvedAspectRatio : null;
  const resolution = typeof body?.resolution === 'string' ? body.resolution : '1024x1024';
  const falResolution = normalizeFalResolution(resolution);

  const falClient = getFalClient();
  let providerJobId: string | undefined;

  try {
    const result = await falClient.subscribe(modeConfig.falModelId, {
      input: {
        prompt,
        num_images: numImages,
        ...(mode === 'i2i' ? { image_urls: imageUrls } : {}),
        ...(falAspectRatio ? { aspect_ratio: falAspectRatio } : {}),
        ...(falResolution ? { resolution: falResolution } : {}),
      },
      mode: 'polling',
      onEnqueue(requestId) {
        providerJobId = requestId;
      },
      onQueueUpdate(update) {
        if (update?.request_id) {
          providerJobId = update.request_id;
        }
      },
    });

    const images = extractImages(result.data);
    if (!images.length) {
      throw new Error('Fal did not return images');
    }

    const normalizedImages = images.map((image) => ({
      ...image,
      url: normalizeMediaUrl(image.url) ?? image.url,
    }));

    const hero = normalizedImages[0]?.url ?? null;
    const renderIds = normalizedImages.map((image) => image.url);

    // Update job as completed
    await updateJob(jobId, {
      thumbUrl: hero,
      status: 'completed',
      progress: 100,
      providerJobId: providerJobId ?? result.requestId ?? null,
      renderIds,
      heroRenderId: hero,
      message: null,
    });

    return NextResponse.json({
      ok: true,
      jobId,
      mode,
      images: normalizedImages,
      description: null,
      requestId: providerJobId ?? result.requestId ?? undefined,
      providerJobId: providerJobId ?? undefined,
      engineId: engineEntry.id,
      engineLabel: engineEntry.marketingName,
      durationMs: undefined,
      costCents: totalCents,
      currency: 'USD',
      paymentStatus: 'paid_wallet',
      thumbUrl: hero,
      aspectRatio: resolvedAspectRatio,
      resolution,
    } satisfies ImageGenerationResponse);
  } catch (error) {
    console.error('[images] Fal generation failed', error);

    const providerErrors =
      error instanceof ValidationError
        ? error.fieldErrors
            .map((entry) => {
              const loc = Array.isArray(entry.loc) ? entry.loc.filter((part) => part !== 'body') : [];
              const path = loc.length ? loc.join('.') : null;
              const msg = typeof entry.msg === 'string' ? entry.msg.trim() : '';
              if (!msg) return null;
              return path ? `${path}: ${msg}` : msg;
            })
            .filter((entry): entry is string => Boolean(entry))
        : [];

    const messageBase = error instanceof Error && error.message ? error.message : 'Fal request failed';
    const message = providerErrors.length > 0 ? providerErrors.slice(0, 3).join(' · ') : messageBase;

    // Update job as failed
    await updateJob(jobId, {
      status: 'failed',
      progress: 0,
      message,
      providerJobId: providerJobId ?? null,
    });

    // Refund the wallet charge
    await refundWallet({
      userId,
      amountCents: totalCents,
      currency: 'USD',
      description: `Refund: ${engineEntry.marketingName} – ${numImages} image${numImages > 1 ? 's' : ''}`,
      jobId,
    });

    const providerStatus = error instanceof ApiError && typeof error.status === 'number' ? error.status : null;
    const providerBody = error instanceof ApiError ? error.body : null;

    return respondError(mode, 'fal_error', message, 502, { providerStatus, providerBody }, {
      engineId: engineEntry.id,
      engineLabel: engineEntry.marketingName,
      jobId,
      paymentStatus: 'refunded_wallet',
    });
  }
}
