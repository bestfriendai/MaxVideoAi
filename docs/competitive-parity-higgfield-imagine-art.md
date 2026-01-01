# MaxVideoAI parity plan: Higgfield and imagine.art level functionality

Purpose: provide a grounded, codebase-specific roadmap to raise MaxVideoAI to a best-in-class level comparable to top-tier AI creation products. This document is based on the current repo structure, API routes, UI surfaces, and integrations.

## 1) Current product surface map (from this repo)

### Core generation
- Main workspace UI lives in `frontend/app/(core)/(workspace)/app/page.tsx` (video generation) and `frontend/app/(core)/(workspace)/app/image/ImageWorkspace.tsx` (image generation).
- Engine catalog is defined in `frontend/src/config/falEngines.ts` and exposed by `frontend/app/api/engines/route.ts`.
- Preflight pricing runs via `frontend/app/api/preflight/route.ts` and pricing kernel in `packages/pricing/src`.
- Generation pipeline is anchored in `frontend/app/api/generate/route.ts` and `frontend/src/lib/fal.ts`.

### Job tracking and asset management
- Job persistence for video uses Postgres (`frontend/src/lib/db.ts`, `frontend/app/api/jobs/route.ts`, `frontend/server/fal-webhook-handler.ts`).
- Image jobs and wallet for images use Firestore (`frontend/src/lib/firestore-db.ts`, `frontend/app/api/images/generate/route.ts`, `frontend/app/api/wallet/route.ts`).
- Asset uploads are handled by `frontend/app/api/uploads/image/route.ts` and `frontend/server/storage.ts` with S3 or Firebase Storage fallback.
- Gallery, group, and preview flows live in `frontend/components/GalleryRail.tsx`, `frontend/components/groups/*`, and `frontend/components/QuadPreviewPanel.tsx`.

### Billing and membership
- Stripe topups and pricing are in `frontend/app/api/stripe/*`, `frontend/app/api/wallet/route.ts`, and `frontend/src/lib/pricing*`.
- Membership tiers and discounts are in `frontend/src/lib/membership.ts` and pricing definitions in `packages/pricing/src/definitions.ts`.

### Admin and compliance
- Admin surfaces under `frontend/app/(core)/admin/*` (engines, pricing, marketing, moderation, users).
- Legal/cookie/consent flows in `frontend/components/legal/*` and `frontend/app/(core)/legal/*`.
- Health endpoints in `frontend/app/api/health/*`.

### Known partial or stubbed functionality
- Extend is stubbed in `frontend/app/api/extend/route.ts`.
- Upscale and audio endpoints only flag DB state, no real processing in `frontend/app/api/upscale/route.ts` and `frontend/app/api/audio/route.ts`.
- Video generation only accepts t2v/i2v in `frontend/app/api/generate/route.ts` even though `Mode` includes r2v.

## 2) What best-in-class looks like (functional targets)

This section defines the expected experience if we are targeting Higgfield/Imagine.art quality, without relying on any proprietary details.

### A) Generation quality and creative control
- High quality defaults with minimal prompt tuning required.
- Consistent output across runs with seed, reference image, and character/style locking.
- Strong camera, motion, and cinematography controls, including shot planning.
- Reliable audio and upscaling features that are production ready.

### B) Workflow speed and iteration
- Fast preflight pricing and real-time queue updates.
- Iteration tools: batch variations, prompt history, versioning, and rerun diffs.
- Easy remixing: start from any output, change 1-2 controls, and regenerate.

### C) Library, sharing, and reuse
- Organized asset library with tagging, collections, and search.
- Shareable links, public gallery, and clear rights/visibility controls.
- Multi-step pipelines: storyboard, generate, edit, assemble, publish.

### D) Reliability and trust
- Near-zero failed jobs, automatic recovery, and clear error messaging.
- Transparent pricing and predictable run times.
- Strong safety and moderation tooling.

## 3) Gap analysis: current vs target

### 3.1 Creative controls and editing
Current:
- Prompt, negative prompt, aspect ratio, duration, FPS, audio toggle in UI.
- No built-in timeline, multi-shot editor, or advanced prompt structuring beyond the workspace UI.
- No v2v or true video editing features exposed. Mode includes r2v but the generate route only allows t2v/i2v.

Gaps:
- Multi-shot storyboarding is missing.
- No keyframe or camera control UI mapping to engine features.
- No in-app video editing (trim, extend, stitch, audio replace).

### 3.2 Media enhancement
Current:
- Upscale and audio endpoints are placeholders, not true processing.
- Extend endpoint is stubbed.

Gaps:
- No real upscaler pipeline.
- No audio synthesis or sound design pipeline.
- No clip extension workflow.

### 3.3 Workflow and iteration
Current:
- Batch generation exists via iterations in the workspace and job groups.
- Gallery rail and group viewer exist but are limited to render review.

Gaps:
- No version history diff view or prompt evolution tracking.
- No experiment management (A/B prompt runs, compare modes).
- No visual prompt builder or style/brand kits.

### 3.4 Asset library and reuse
Current:
- User assets are stored in `user_assets` and surfaced by AssetLibraryModal.

Gaps:
- No tagging, search, folders, or collection management.
- No metadata enrichment (style, engine, prompt summary, mood).

### 3.5 Engine capability parity
Current:
- Engine configs are defined with fields like keyframes, motion controls, etc, but UI coverage is partial.
- Pricing and capabilities are defined but not consistently exposed in UI.

Gaps:
- UI does not consistently surface all engine features.
- No engine-specific prompt templates or validation per engine.

### 3.6 Reliability, scale, and observability
Current:
- Fal webhook and poller exist, but job recovery is limited to polling.
- No rate limiting or queue-level health circuit breakers.
- Mixed persistence (Postgres for video, Firestore for image/wallet) increases complexity.

Gaps:
- No unified queue/state system.
- Limited observability and analytics for per-engine quality and cost.
- Error recovery is not user-visible with actionable next steps.

### 3.7 Visual design, brand, and polish
Current:
- UI uses Tailwind and shared components in `frontend/components/ui/*` and tokens in `frontend/src/styles/tokens.css`.
- Marketing and product UI styling diverge; some components are bespoke and some are generic.

Gaps:
- No single design system with strict layout, typography, spacing, and color standards.
- Inconsistent motion and micro-interaction patterns between marketing and app surfaces.
- No unified art direction for the gallery and engine showcase.

## 4) Improvement plan by layer

### 4.1 Product and UX upgrades
1) Generation workspace 2.0
- Split `frontend/app/(core)/(workspace)/app/page.tsx` into composable panels.
- Introduce a multi-shot storyboard UI with drag/drop shot cards and per-shot prompt controls.
- Add structured prompt builder (scene, subject, camera, light, motion) and reusable prompt templates.

2) Editing surface
- Add a timeline editor to assemble multiple clips, trim, and extend.
- Add clip-level adjustments (speed, crop, stabilize, color LUTs).
- Add audio track editor (SFX and music layers).

3) Creator library
- Add asset tagging and search (by engine, style, prompt, time, aspect ratio).
- Add collections and shareable boards.
- Add internal style kits and brand presets.

4) Better iteration tools
- Add compare view for multiple runs (A/B/C prompt or engine).
- Add batch rerun with diff controls (only change 1 parameter).
- Add remix button from any output to pre-fill workspace.

### 4.2 Backend and pipeline upgrades
1) True upscale pipeline
- Implement actual upscaling for videos and images via a provider or internal pipeline.
- Update `frontend/app/api/upscale/route.ts` to queue a real job and return status.
- Add billing line items and job status handling.

2) Audio pipeline
- Add audio generation or audio attach flow (speech + ambience) and encode into output.
- Update `frontend/app/api/audio/route.ts` to trigger audio jobs and store resulting media.

3) Extend pipeline
- Implement `frontend/app/api/extend/route.ts` to call provider extension models or internal stitching.
- Add UI for extension prompts and continuity guidance.

4) Unified job model
- Consolidate Firestore and Postgres or clearly split by product line.
- Add a shared job schema and status vocabulary for video and image jobs.

5) Event-driven updates
- Add real-time updates using WebSockets or Supabase Realtime to reduce polling.
- Surface partial outputs or progress if providers support it.

### 4.3 Quality and safety
- Build engine-specific validation: enforce mode limits and required fields based on `frontend/src/config/falEngines.ts`.
- Add deterministic prompt cleanup and guardrails for invalid inputs.
- Add transparent safety messaging and safe fallback suggestions.

### 4.4 Pricing clarity and trust
- Add pricing explanation cards in the workspace UI tied to `packages/pricing` outputs.
- Show estimated duration based on historical engine averages (already exposed via `/api/engines`).
- Add cost calculator that shows base, add-ons, and membership discounts.

### 4.5 Visual and interaction design upgrades
- Establish a single design system with typography, spacing, and component standards in `frontend/components/ui/*` and `frontend/src/styles/tokens.css`.
- Add a cohesive motion system: workspace transitions, job status animations, and gallery reveals.
- Create a premium asset preview and viewer (full-screen playback, metadata panel, share controls).
- Improve mobile UX with a dedicated bottom control stack and compact mode for the composer.

### 4.6 Activation, onboarding, and retention
- Add a guided onboarding flow with first-run templates and curated engine presets in `frontend/components/Onboarding.tsx`.
- Create prompt libraries and starter packs (ads, product shots, cinematic, UGC).
- Add “success loops”: after each output, offer remix, expand, or storyboard actions.

### 4.7 Team and pro workflows
- Team workspaces with shared asset libraries and approval states.
- Project-based organization (campaigns, client folders, brand kits).
- Role-based permissions and audit logs in admin surfaces under `frontend/app/(core)/admin/*`.

## 5) Technical refactors needed to support parity

### 5.1 Workspace refactor
- Reduce the monolithic component in `frontend/app/(core)/(workspace)/app/page.tsx`.
- Move state management into hooks or Zustand slices with clear domains (prompt, assets, pricing, jobs).
- Introduce memoization for heavy components like `EngineSelect` and `QuadPreviewPanel`.

### 5.2 Schema and data model
- Introduce job versioning (prompt changes, model changes, results lineage).
- Normalize asset metadata and add indexing for search and filtering.

### 5.3 API hardening
- Add rate limiting for `/api/generate`, `/api/images/generate`, and billing routes.
- Improve retry logic and idempotency for generate requests.
- Standardize error codes across API responses.

### 5.4 Observability
- Add structured logging for job lifecycle (created, queued, running, completed, failed).
- Add per-engine metrics for failure rate, average duration, user satisfaction.

### 5.5 Unified data model and persistence
- Choose a single source of truth for jobs, wallets, and assets (Postgres vs Firestore) to avoid split logic.
- Introduce a shared job schema for video and image with consistent status enums and lifecycle events.
- Add transaction safety for wallet operations and job creation (especially when mixing Stripe, Fal, and storage).

## 6) Competitive parity roadmap

### Phase 1 (0-30 days): quick wins
- Implement real upscaling pipeline and remove placeholder behavior.
- Implement extend pipeline for video continuation.
- Add remix and compare tools in the workspace UI.
- Tighten validation and error reporting.

### Phase 2 (30-90 days): workflow and library
- Introduce a storyboard editor and shot templates.
- Add asset tagging, collections, and search.
- Add audio pipeline and basic mixing controls.
- Add real-time job updates (SSE or WebSockets).

### Phase 3 (90-180 days): pro-grade creation
- Add timeline editor with clip assembly.
- Add advanced camera controls and keyframe UI.
- Add style kits and brand presets for agencies.
- Add collaboration and sharing workflows (team spaces, approvals).

## 7) KPI targets to validate parity
- Job failure rate under 1 percent for top engines.
- Average queue wait time under 15 seconds for standard tier.
- Repeat usage rate over 40 percent within 7 days.
- At least 50 percent of outputs saved to collections or shared.

## 8) File and component impact map

- Workspace UI: `frontend/app/(core)/(workspace)/app/page.tsx`
- Image workspace: `frontend/app/(core)/(workspace)/app/image/ImageWorkspace.tsx`
- Generation pipeline: `frontend/app/api/generate/route.ts`, `frontend/src/lib/fal.ts`
- Asset pipeline: `frontend/app/api/uploads/image/route.ts`, `frontend/server/storage.ts`
- Jobs and status: `frontend/app/api/jobs/route.ts`, `frontend/server/fal-webhook-handler.ts`, `frontend/server/fal-poll.ts`
- Pricing: `packages/pricing/src/*`, `frontend/src/lib/pricing*`
- Admin surfaces: `frontend/app/(core)/admin/*`
- UI system and styles: `frontend/components/ui/*`, `frontend/src/styles/tokens.css`, `frontend/app/globals.css`
- Marketing and engine pages: `frontend/components/marketing/*`, `frontend/app/(localized)/[locale]/(marketing)/*`
- Stripe webhooks: `frontend/app/api/stripe/webhook/route.ts`, `frontend/pages/api/stripe-webhook.ts`

## 9) Bugs, risks, and underdeveloped areas to address

### 9.1 Stubbed or placeholder functionality
- Extend is stubbed and returns 501, blocking any clip continuation workflow (`frontend/app/api/extend/route.ts`).
- Upscale and audio routes only set DB flags, not real processing (`frontend/app/api/upscale/route.ts`, `frontend/app/api/audio/route.ts`).
- Firebase functions are demo-level and not integrated with Fal or the pricing kernel (`functions/src/index.ts`).

### 9.2 Mode and capability mismatches
- `Mode` includes `r2v` and `t2i/i2i`, but `/api/generate` only permits `t2v/i2v` (`frontend/types/engines.ts`, `frontend/app/api/generate/route.ts`).
- Validation uses `fixtures/engineCaps` rather than the main engine config, risking drift between UI and server rules (`frontend/app/api/generate/_lib/validate.ts`, `frontend/src/config/falEngines.ts`).

### 9.3 Billing and data integrity risks
- Two Stripe webhook handlers exist, which can cause duplicated events if both are active (`frontend/app/api/stripe/webhook/route.ts`, `frontend/pages/api/stripe-webhook.ts`).
- Wallet logic is split across Firestore and Postgres; images use Firestore receipts while video billing uses Postgres, making balances and tiers inconsistent (`frontend/src/lib/firestore-db.ts`, `frontend/src/lib/membership.ts`).
- Firestore wallet initialization is not transactional and can double-issue the welcome bonus under concurrent requests (`frontend/src/lib/firestore-db.ts`).
- Firestore wallet balance aggregates by scanning all receipts, which will not scale for large histories (`frontend/src/lib/firestore-db.ts`).

### 9.4 UX and system design debt
- The main workspace page is a monolithic client component with heavy state and render cost (`frontend/app/(core)/(workspace)/app/page.tsx`).
- Some state stores appear unused or outdated, indicating incomplete refactors (`frontend/src/stores/generationStore.ts`).
- Image generation pricing is hard-coded per image and does not use the shared pricing kernel (`frontend/app/api/images/generate/route.ts`).

## 10) Workspace overhaul: fixes with code examples

This section focuses only on the workspace experience and includes concrete fixes with example code to make the core flow reliable, fast, and extensible.

### 10.1 Break up the monolithic workspace component

Problem:
- `frontend/app/(core)/(workspace)/app/page.tsx` is extremely large, owns too much state, and re-renders too often.

Fix:
- Split the workspace into feature panels and move logic into hooks and context.

Example: create a provider + slice hooks.

```tsx
// frontend/src/workspace/WorkspaceProvider.tsx
'use client';

import React, { createContext, useContext, useMemo, useReducer } from 'react';

type WorkspaceState = {
  engineId: string;
  mode: 't2v' | 'i2v';
  prompt: string;
  negativePrompt: string;
  durationSec: number;
  aspectRatio: string;
  resolution: string;
  audio: boolean;
};

type WorkspaceAction =
  | { type: 'setPrompt'; value: string }
  | { type: 'setEngine'; value: string }
  | { type: 'setMode'; value: 't2v' | 'i2v' }
  | { type: 'setDuration'; value: number }
  | { type: 'setAspectRatio'; value: string }
  | { type: 'setResolution'; value: string }
  | { type: 'setAudio'; value: boolean };

const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
} | null>(null);

const initialState: WorkspaceState = {
  engineId: 'veo-3-1',
  mode: 't2v',
  prompt: '',
  negativePrompt: '',
  durationSec: 4,
  aspectRatio: '16:9',
  resolution: '1080p',
  audio: true,
};

function reducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'setPrompt':
      return { ...state, prompt: action.value };
    case 'setEngine':
      return { ...state, engineId: action.value };
    case 'setMode':
      return { ...state, mode: action.value };
    case 'setDuration':
      return { ...state, durationSec: action.value };
    case 'setAspectRatio':
      return { ...state, aspectRatio: action.value };
    case 'setResolution':
      return { ...state, resolution: action.value };
    case 'setAudio':
      return { ...state, audio: action.value };
    default:
      return state;
  }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
```

### 10.2 Isolate panels and memoize heavy UI

Fix:
- Extract panels into `frontend/src/workspace/*` and memoize expensive UI.

```tsx
// frontend/src/workspace/EnginePanel.tsx
'use client';

import React from 'react';
import { EngineSelect } from '@/components/ui/EngineSelect';
import { useWorkspace } from './WorkspaceProvider';

export const EnginePanel = React.memo(function EnginePanel() {
  const { state, dispatch } = useWorkspace();
  return (
    <EngineSelect
      value={state.engineId}
      onChange={(engineId) => dispatch({ type: 'setEngine', value: engineId })}
    />
  );
});
```

### 10.3 Centralize preflight and pricing state

Problem:
- Pricing is recomputed in multiple places and is hard to reason about.

Fix:
- Create a pricing hook that accepts state and manages debounce and errors.

```tsx
// frontend/src/workspace/useWorkspacePricing.ts
import { useEffect, useMemo, useState } from 'react';
import { runPreflight } from '@/lib/api';

export function useWorkspacePricing(input: {
  engineId: string;
  mode: string;
  durationSec: number;
  resolution: string;
  aspectRatio: string;
  audio: boolean;
}) {
  const [pricing, setPricing] = useState<{ ok: boolean; totalCents?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      engine: input.engineId,
      mode: input.mode,
      durationSec: input.durationSec,
      resolution: input.resolution,
      aspectRatio: input.aspectRatio,
      audio: input.audio,
    }),
    [input]
  );

  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(async () => {
      try {
        const res = await runPreflight(payload);
        if (isActive) {
          setPricing({ ok: res.ok, totalCents: res.totalCents ?? res.total });
          setError(res.ok ? null : res.error?.message || 'Pricing unavailable');
        }
      } catch (err) {
        if (isActive) setError('Pricing request failed');
      }
    }, 200);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [payload]);

  return { pricing, error };
}
```

### 10.4 Fix engine capability validation drift

Problem:
- Validation currently uses `fixtures/engineCaps` and can drift from the live config in `frontend/src/config/falEngines.ts`.

Fix:
- Use the configured engine caps in validation, or export a shared validation helper from `frontend/src/lib/engines.ts`.

Example: adapt validation to `getConfiguredEngine`.

```ts
// frontend/app/api/generate/_lib/validate.ts
import { getConfiguredEngine } from '@/server/engines';

export async function validateRequest(engineId: string, mode: Mode | undefined, payload: Record<string, unknown>) {
  const engine = await getConfiguredEngine(engineId);
  if (!engine) {
    return { ok: false, error: { code: 'ENGINE_UNKNOWN', message: 'Unsupported engine' } };
  }
  // Use engine.resolutions, engine.aspectRatios, engine.modes, engine.inputSchema
  // to enforce constraints consistently with the UI.
}
```

### 10.5 Make job updates real-time and resilient

Fix:
- Use SSE or Supabase Realtime to stream job status updates instead of polling.

Example: add a minimal SSE stream for job updates.

```ts
// frontend/app/api/jobs/stream/route.ts
import { NextRequest } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await getRouteAuthContext(req);
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const interval = setInterval(async () => {
        const rows = await query(
          'SELECT job_id, status, progress, thumb_url, video_url FROM app_jobs WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20',
          [userId]
        );
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(rows)}\\n\\n`));
      }, 2000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### 10.6 Add a comparison and remix workflow

Fix:
- Add a Compare drawer that shows 2-4 runs side-by-side with diffing and a Remix button.

Example: structure compare inputs.

```ts
// frontend/src/workspace/compare/types.ts
export type CompareEntry = {
  jobId: string;
  engineId: string;
  prompt: string;
  durationSec: number;
  aspectRatio: string;
  resolution: string;
  thumbUrl: string | null;
  videoUrl: string | null;
};
```

### 10.7 Improve asset handling and reference usability

Fix:
- Provide clearer states for uploading and validating assets, and block generation until ready.
- Add reusable reference sets (save a pack of 1-3 images as a preset).

Example: enforce asset readiness before generate.

```ts
const allAssetsReady = inputs.every((entry) => entry.status === 'ready');
if (!allAssetsReady) {
  return setError('Wait for uploads to finish before generating.');
}
```

### 10.8 Make the workspace state persistent and recoverable

Fix:
- Persist the workspace state in localStorage and restore on load.

```ts
// frontend/src/workspace/useWorkspacePersistence.ts
import { useEffect } from 'react';

export function useWorkspacePersistence(state: unknown, onRestore: (value: unknown) => void) {
  useEffect(() => {
    const raw = window.localStorage.getItem('workspace.v1');
    if (raw) {
      try {
        onRestore(JSON.parse(raw));
      } catch {
        // ignore invalid state
      }
    }
  }, [onRestore]);

  useEffect(() => {
    window.localStorage.setItem('workspace.v1', JSON.stringify(state));
  }, [state]);
}
```

## 11) Suggested next actions
1) Confirm the exact parity goals: which Higgfield/imagine.art features are highest priority.
2) Decide on a unified persistence strategy (Postgres vs Firestore).
3) Approve Phase 1 items and start with Extend + Upscale + Remix improvements.
