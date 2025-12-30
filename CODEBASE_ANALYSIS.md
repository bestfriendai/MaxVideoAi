# MaxVideoAI - Comprehensive Codebase Analysis & Improvement Roadmap

> **Document Version:** 1.0
> **Date:** December 30, 2025
> **Target Stack:** Vercel (Frontend) + Firebase (Backend)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Overview](#2-current-architecture-overview)
3. [Critical Issues & Fixes Required](#3-critical-issues--fixes-required)
4. [Backend Improvements](#4-backend-improvements)
5. [Frontend Improvements](#5-frontend-improvements)
6. [UI/UX Enhancements](#6-uiux-enhancements)
7. [Feature Recommendations](#7-feature-recommendations)
8. [Firebase Migration Strategy](#8-firebase-migration-strategy)
9. [Security Improvements](#9-security-improvements)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Technical Debt](#11-technical-debt)
12. [Priority Roadmap](#12-priority-roadmap)

---

## 1. Executive Summary

### What is MaxVideoAI?

MaxVideoAI is a **multi-engine AI video generation platform** that allows users to create videos using various AI providers (Sora, Runway, Pika, Luma Ray 2, Minimax, Kling, Veo). The platform supports:

- **Text-to-Video (T2V)** - Generate videos from text prompts
- **Image-to-Video (I2V)** - Animate images into videos
- **Video-to-Video (V2V)** - Transform existing videos
- **Image Generation** - Create images via DALL-E
- **Video Upscaling** - Enhance video resolution

### Current Tech Stack

| Layer | Current Technology | Target Technology |
|-------|-------------------|-------------------|
| Frontend Hosting | Vercel | Vercel ✓ |
| Frontend Framework | Next.js 14.2.5 (App Router) | Next.js (keep) |
| UI Styling | Tailwind CSS 3.4.3 | Tailwind CSS (keep) |
| Authentication | Supabase Auth | **Firebase Auth** |
| Database | PostgreSQL (Neon + Supabase) | **Firestore** |
| File Storage | AWS S3 | **Firebase Storage** |
| Serverless Functions | Next.js API Routes | **Firebase Functions** (optional) |
| Payments | Stripe + Stripe Connect | Stripe (keep) |
| Email | Resend + Nodemailer | Keep or Firebase Extensions |
| Analytics | Clarity + GTM + GA4 | Keep |

### Key Statistics

| Metric | Value |
|--------|-------|
| Total API Routes | 87+ |
| React Components | 100+ |
| Lines of Code (Frontend) | ~50,000+ |
| Database Tables | 14+ |
| Supported Languages | 3 (EN, FR, ES) |
| AI Engine Integrations | 8+ |

### Overall Assessment

| Category | Score | Notes |
|----------|-------|-------|
| **Code Quality** | 6/10 | God components, props drilling, limited abstractions |
| **Architecture** | 7/10 | Solid Next.js patterns, but monolithic components |
| **Security** | 5/10 | Missing rate limiting, SSRF risks, timing attacks |
| **Performance** | 6/10 | No memoization, large bundles, cold start issues |
| **UI/UX** | 7/10 | Functional but inconsistent, accessibility gaps |
| **Maintainability** | 5/10 | 4,848-line components, 37 useState in one file |
| **Test Coverage** | 2/10 | Minimal testing infrastructure |

---

## 2. Current Architecture Overview

### 2.1 Directory Structure

```
/MaxVideoAi
├── frontend/                    # Main Next.js application
│   ├── app/                     # Next.js App Router
│   │   ├── (core)/             # Protected routes (dashboard, generate, jobs, etc.)
│   │   ├── (localized)/        # i18n marketing pages (EN/FR/ES)
│   │   └── api/                # 87+ API route handlers
│   ├── components/             # 100+ React components
│   ├── src/
│   │   ├── lib/                # 40+ utility libraries
│   │   ├── server/             # 24+ server utilities
│   │   ├── hooks/              # 4 custom hooks (severely limited)
│   │   └── config/             # Configuration files
│   ├── types/                  # TypeScript definitions
│   ├── messages/               # i18n translations (en.json, fr.json, es.json)
│   └── public/                 # Static assets
├── packages/
│   └── pricing/                # Shared pricing computation package
├── supabase/                   # Supabase migrations & config
├── neon/                       # Neon Postgres migrations
└── docs/                       # Documentation
```

### 2.2 Current Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Next.js 14 App                           ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │Marketing │  │ Generate │  │  Jobs    │  │  Admin   │   ││
│  │  │  Pages   │  │Workspace │  │ History  │  │  Panel   │   ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   API Routes (Node.js)                      ││
│  │  /api/generate  /api/stripe  /api/fal  /api/admin  etc.    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────────────┐
    │                    External Services                         │
    │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────┐ │
    │  │ FAL.ai │  │ Stripe │  │Supabase│  │  Neon  │  │  S3   │ │
    │  │ (Video)│  │(Payment│  │ (Auth) │  │(Postgres)│ │(Files)│ │
    │  └────────┘  └────────┘  └────────┘  └────────┘  └───────┘ │
    └─────────────────────────────────────────────────────────────┘
```

### 2.3 Authentication Flow (Current - Supabase)

```
1. User submits email/password
2. Supabase Auth validates credentials
3. JWT token issued (1 hour expiry)
4. Token stored in cookies
5. Middleware validates on each request
6. Refresh token rotation enabled
```

### 2.4 Video Generation Flow

```
1. User submits prompt + settings
2. /api/generate validates input
3. Pricing calculated & wallet charged
4. Job record created (status: pending)
5. FAL.ai API called asynchronously
6. Webhook or polling updates job status
7. Video URL stored, thumbnail generated
8. User notified of completion
```

### 2.5 Payment Flow

```
1. User selects topup amount
2. Stripe Checkout session created
3. User completes payment
4. Webhook: checkout.session.completed
5. Receipt recorded in database
6. Wallet balance updated
7. User can generate videos
```

---

## 3. Critical Issues & Fixes Required

### 3.1 🔴 CRITICAL: God Component Anti-Pattern

**File:** `/frontend/app/(core)/(workspace)/app/page.tsx`
**Lines:** 4,848 lines in a single component

**Problem:**
- 37 separate `useState` declarations
- 5+ nested business logic functions
- Impossible to test, maintain, or refactor
- Every state change re-renders the entire component tree

**Current State:**
```typescript
// This is what exists - anti-pattern
const [prompt, setPrompt] = useState('');
const [negativePrompt, setNegativePrompt] = useState('');
const [engine, setEngine] = useState(null);
const [mode, setMode] = useState('t2v');
const [duration, setDuration] = useState(5);
const [resolution, setResolution] = useState('720p');
const [aspectRatio, setAspectRatio] = useState('16:9');
const [iterations, setIterations] = useState(1);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [price, setPrice] = useState(null);
const [preflight, setPreflight] = useState(null);
// ... 25 more useState declarations
```

**Fix Required:**
```typescript
// Split into focused components with custom hooks
// 1. Create useGenerationForm hook
function useGenerationForm() {
  const [form, dispatch] = useReducer(formReducer, initialState);
  return { form, dispatch, actions };
}

// 2. Create context for shared state
const GenerationContext = createContext<GenerationState>(null);

// 3. Split components
<GenerationProvider>
  <ComposerPanel />      {/* ~300 lines */}
  <PreviewPanel />       {/* ~400 lines */}
  <GalleryRail />        {/* ~200 lines */}
  <SettingsPanel />      {/* ~300 lines */}
</GenerationProvider>
```

**Priority:** 🔴 Critical
**Effort:** 2-3 weeks
**Impact:** Maintainability, Performance, Testing

---

### 3.2 🔴 CRITICAL: No Component Memoization

**Problem:** Zero `React.memo()` implementations across 100+ components

**Affected Components:**
| Component | Lines | Re-render Impact |
|-----------|-------|------------------|
| EngineSelect | 1,005 | Every parent state change |
| ImageWorkspace | 2,292 | Every parent state change |
| Dashboard | 1,742 | Every parent state change |
| Composer | 688 | Every keystroke |
| QuadPreviewPanel | 800+ | Every state change |

**Fix Required:**
```typescript
// Wrap expensive components
const EngineSelect = React.memo(function EngineSelect(props) {
  // component logic
});

// Use useCallback for passed functions
const handleEngineChange = useCallback((engine) => {
  setSelectedEngine(engine);
}, []);

// Use useMemo for expensive computations
const filteredEngines = useMemo(() =>
  engines.filter(e => e.status === 'live'),
  [engines]
);
```

**Priority:** 🔴 Critical
**Effort:** 1 week
**Impact:** Performance (50%+ render reduction possible)

---

### 3.3 🔴 CRITICAL: Missing Rate Limiting

**Problem:** No request throttling on expensive API endpoints

**Vulnerable Endpoints:**
- `POST /api/generate` - Video generation ($$$ per request)
- `POST /api/images/generate` - Image generation
- `POST /api/upscale` - Video upscaling
- `GET /api/admin/*` - Admin operations
- `POST /api/auth/*` - Authentication (brute force risk)

**Current State:** No rate limiting implementation found

**Fix Required:**
```typescript
// Using Upstash Redis for rate limiting
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  // Continue with request handling
}
```

**Priority:** 🔴 Critical
**Effort:** 3-5 days
**Impact:** Security, Cost Protection

---

### 3.4 🔴 CRITICAL: SSRF Vulnerability

**File:** `/frontend/app/api/generate/_lib/validate.ts`

**Problem:** Image URL probing can leak internal network information

**Vulnerable Code:**
```typescript
// Current - vulnerable to SSRF
async function probeImageUrl(url: string) {
  const response = await fetch(url); // No timeout, no IP validation
  // ... process response
}
```

**Fix Required:**
```typescript
import { isPrivateIP } from '@/lib/security';

async function probeImageUrl(url: string) {
  const parsedUrl = new URL(url);

  // Block private IP ranges
  const resolved = await dns.resolve4(parsedUrl.hostname);
  if (resolved.some(ip => isPrivateIP(ip))) {
    throw new Error('Private IP addresses not allowed');
  }

  // Add timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'error', // Prevent redirect-based attacks
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// Helper function
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127
  );
}
```

**Priority:** 🔴 Critical
**Effort:** 1-2 days
**Impact:** Security

---

### 3.5 🟠 HIGH: Webhook Timing Attack

**File:** `/frontend/app/api/fal/webhook/route.ts`

**Problem:** Token comparison vulnerable to timing attacks

**Vulnerable Code:**
```typescript
// Current - vulnerable
if (tokenParam !== expectedToken) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Fix Required:**
```typescript
import { timingSafeEqual } from 'crypto';

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Usage
if (!secureCompare(tokenParam, expectedToken)) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Priority:** 🟠 High
**Effort:** 1 hour
**Impact:** Security

---

### 3.6 🟠 HIGH: Props Drilling (4+ Levels)

**Problem:** State passed through 4+ component levels without Context

**Example Chain:**
```
Workspace (37 useState)
  → Composer (20+ props)
    → AssetField (10+ props)
      → AssetSlot (8+ props)
        → UploadButton (5+ props)
```

**Fix Required:**
```typescript
// Create context for generation state
interface GenerationContextValue {
  form: GenerationForm;
  assets: AssetState;
  dispatch: Dispatch<GenerationAction>;
  actions: {
    setPrompt: (value: string) => void;
    addAsset: (field: string, file: File) => void;
    removeAsset: (field: string, index: number) => void;
    // ... other actions
  };
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

// Custom hook for consumers
function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}

// Provider wraps workspace
function GenerationProvider({ children }) {
  const [form, dispatch] = useReducer(generationReducer, initialState);
  const actions = useMemo(() => createActions(dispatch), []);

  return (
    <GenerationContext.Provider value={{ form, dispatch, actions }}>
      {children}
    </GenerationContext.Provider>
  );
}
```

**Priority:** 🟠 High
**Effort:** 1-2 weeks
**Impact:** Maintainability, Developer Experience

---

### 3.7 🟠 HIGH: Inconsistent Error Handling

**Problem:** 50+ components with different error handling patterns

**Current Patterns (Inconsistent):**
```typescript
// Pattern 1: Try-catch with setState
try {
  await fetch(...);
} catch (err) {
  setError(err.message);
}

// Pattern 2: .then().catch()
fetch(...).then(res => {...}).catch(err => {...});

// Pattern 3: SWR error state
const { error } = useSWR(...);

// Pattern 4: No error handling at all
await fetch(...); // Errors thrown to parent
```

**Fix Required:**
```typescript
// Centralized error handler
class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public status: number = 500,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

// Error boundary for React components
function ErrorBoundary({ children, fallback }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || DefaultErrorFallback}
      onError={(error) => {
        // Log to monitoring service
        logError(error);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Unified fetch wrapper
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new AppError(
        error.message || 'Request failed',
        error.code || 'UNKNOWN_ERROR',
        res.status
      );
    }
    return res.json();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Network error', 'NETWORK_ERROR', 0, true);
  }
}
```

**Priority:** 🟠 High
**Effort:** 1 week
**Impact:** User Experience, Debugging

---

### 3.8 🟡 MEDIUM: Missing Test Coverage

**Current State:**
- No unit tests found
- No integration tests
- No E2E tests
- Only Lighthouse CI for performance

**Fix Required:**
```
/frontend
├── __tests__/
│   ├── unit/
│   │   ├── hooks/
│   │   │   ├── useGenerationForm.test.ts
│   │   │   └── useRequireAuth.test.ts
│   │   ├── components/
│   │   │   ├── Composer.test.tsx
│   │   │   └── EngineSelect.test.tsx
│   │   └── lib/
│   │       ├── pricing.test.ts
│   │       └── wallet.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── generate.test.ts
│   │   │   └── stripe-webhook.test.ts
│   │   └── auth/
│   │       └── login-flow.test.ts
│   └── e2e/
│       ├── generation-flow.spec.ts
│       └── payment-flow.spec.ts
├── jest.config.js
└── playwright.config.ts
```

**Testing Stack Recommendation:**
- **Unit Tests:** Vitest (faster than Jest, ESM native)
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright
- **API Tests:** Supertest

**Priority:** 🟡 Medium
**Effort:** 2-4 weeks (ongoing)
**Impact:** Reliability, Confidence

---

### 3.9 🟡 MEDIUM: No Environment Validation

**Problem:** Environment variables not validated at startup

**Current Risk:**
```typescript
// Code fails at runtime if env var missing
const apiKey = process.env.FAL_API_KEY; // Could be undefined
```

**Fix Required:**
```typescript
// /src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  FAL_API_KEY: z.string().min(1),
  FAL_WEBHOOK_TOKEN: z.string().min(32),
  FAL_POLL_TOKEN: z.string().min(32),

  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEFAULT_CURRENCY: z.enum(['eur', 'usd', 'gbp', 'chf']).default('eur'),

  // Feature flags
  PAYMENT_MODE: z.enum(['platform_only', 'connect']).default('platform_only'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}

export const env = validateEnv();
```

**Priority:** 🟡 Medium
**Effort:** 2-3 days
**Impact:** Reliability, Developer Experience

---

## 4. Backend Improvements

### 4.1 API Route Organization

**Current State:** 87+ API routes with inconsistent patterns

**Improvement:** Standardize API structure

```
/api
├── v1/                          # Version prefix
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   └── refresh/route.ts
│   ├── generation/
│   │   ├── video/route.ts
│   │   ├── image/route.ts
│   │   ├── upscale/route.ts
│   │   └── [jobId]/
│   │       ├── status/route.ts
│   │       └── cancel/route.ts
│   ├── billing/
│   │   ├── wallet/route.ts
│   │   ├── topup/route.ts
│   │   └── receipts/route.ts
│   ├── user/
│   │   ├── profile/route.ts
│   │   ├── preferences/route.ts
│   │   └── assets/route.ts
│   └── admin/
│       └── [...]/route.ts
├── webhooks/
│   ├── stripe/route.ts
│   └── fal/route.ts
└── internal/
    └── cron/
        ├── fal-poll/route.ts
        └── reconcile/route.ts
```

### 4.2 Database Query Improvements

**Current Issues:**
- Raw SQL queries without prepared statements
- No query builder abstraction
- Connection pool management unclear

**Recommended: Add Drizzle ORM**

```typescript
// /src/db/schema.ts
import { pgTable, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';

export const jobs = pgTable('app_jobs', {
  id: text('job_id').primaryKey(),
  userId: text('user_id').notNull(),
  engineId: text('engine_id').notNull(),
  mode: text('mode').notNull(),
  status: text('status').notNull().default('pending'),
  prompt: text('prompt'),
  videoUrl: text('video_url'),
  thumbUrl: text('thumb_url'),
  pricingSnapshot: jsonb('pricing_snapshot'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// /src/db/queries/jobs.ts
import { db } from '../client';
import { jobs } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getUserJobs(userId: string, limit = 50) {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.userId, userId))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}

export async function updateJobStatus(jobId: string, status: string, videoUrl?: string) {
  return db
    .update(jobs)
    .set({ status, videoUrl, updatedAt: new Date() })
    .where(eq(jobs.id, jobId))
    .returning();
}
```

### 4.3 Background Job Processing

**Current Issues:**
- Cron-based polling (inefficient)
- No retry queue for failed jobs
- No dead letter queue

**Recommended: Add Job Queue**

```typescript
// Using BullMQ with Redis (or Vercel Queue)
import { Queue, Worker } from 'bullmq';

const videoQueue = new Queue('video-generation', {
  connection: { host: 'redis-host', port: 6379 }
});

// Producer: Add job to queue
export async function queueVideoGeneration(payload: GenerationPayload) {
  return videoQueue.add('generate', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  });
}

// Consumer: Process jobs
const worker = new Worker('video-generation', async (job) => {
  const { payload } = job.data;

  // Call FAL API
  const result = await callFalApi(payload);

  // Update database
  await updateJobStatus(payload.jobId, 'completed', result.videoUrl);

  return result;
}, {
  connection: { host: 'redis-host', port: 6379 },
  concurrency: 5,
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
  // Move to dead letter queue after max retries
});
```

### 4.4 Caching Layer

**Current State:** Minimal caching (30s admin cache, 60s pricing cache)

**Recommended: Redis Caching Strategy**

```typescript
// /src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

interface CacheOptions {
  ttl?: number;  // seconds
  tags?: string[];
}

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300 } = options;

  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await redis.set(key, data, { ex: ttl });

  return data;
}

export async function invalidate(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Usage
const engines = await cached(
  'engines:live',
  () => fetchLiveEngines(),
  { ttl: 60 }
);
```

### 4.5 API Response Standardization

**Current Issues:** Inconsistent response formats

**Recommended: Unified Response Format**

```typescript
// /src/lib/api-response.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export function success<T>(data: T, meta?: ApiResponse<T>['meta']): Response {
  return Response.json({ success: true, data, meta }, { status: 200 });
}

export function created<T>(data: T): Response {
  return Response.json({ success: true, data }, { status: 201 });
}

export function error(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): Response {
  return Response.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}

// Usage in API route
export async function GET(req: Request) {
  try {
    const data = await fetchData();
    return success(data, { total: data.length });
  } catch (err) {
    return error('FETCH_FAILED', err.message, 500);
  }
}
```

### 4.6 Logging & Monitoring

**Current State:** Console.log scattered throughout code

**Recommended: Structured Logging**

```typescript
// /src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
  },
});

// Request logging middleware
export function logRequest(req: Request, context: Record<string, unknown>) {
  logger.info({
    method: req.method,
    url: req.url,
    ...context,
  }, 'Incoming request');
}

// Error logging
export function logError(error: Error, context: Record<string, unknown>) {
  logger.error({
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    ...context,
  }, 'Error occurred');
}

// Metric logging
export function logMetric(name: string, value: number, tags: Record<string, string>) {
  logger.info({ metric: name, value, tags }, 'Metric recorded');
}
```

### 4.7 Webhook Reliability

**Current Issues:**
- No idempotency checks
- No replay protection
- Limited retry handling

**Recommended: Webhook Handler Pattern**

```typescript
// /src/lib/webhook-handler.ts
import { createHmac, timingSafeEqual } from 'crypto';

interface WebhookConfig {
  secret: string;
  signatureHeader: string;
  timestampHeader?: string;
  maxAge?: number;  // seconds
}

export function createWebhookHandler(config: WebhookConfig) {
  return async function verifyWebhook(req: Request): Promise<{
    valid: boolean;
    payload?: unknown;
    error?: string;
  }> {
    const signature = req.headers.get(config.signatureHeader);
    const timestamp = req.headers.get(config.timestampHeader || '');
    const body = await req.text();

    // Verify signature
    const expectedSig = createHmac('sha256', config.secret)
      .update(body)
      .digest('hex');

    if (!signature || !timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    )) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Check timestamp (prevent replay)
    if (config.timestampHeader && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age > (config.maxAge || 300) * 1000) {
        return { valid: false, error: 'Webhook too old' };
      }
    }

    return { valid: true, payload: JSON.parse(body) };
  };
}

// Check idempotency
export async function checkIdempotency(
  eventId: string,
  handler: () => Promise<void>
): Promise<boolean> {
  const key = `webhook:${eventId}`;
  const exists = await redis.get(key);

  if (exists) {
    return false; // Already processed
  }

  // Mark as processing
  await redis.set(key, 'processing', { ex: 86400 }); // 24 hour TTL

  try {
    await handler();
    await redis.set(key, 'completed', { ex: 86400 });
    return true;
  } catch (err) {
    await redis.del(key); // Allow retry on failure
    throw err;
  }
}
```

### 4.8 Database Transactions

**Current Issues:** No transaction support for multi-step operations

**Recommended: Transaction Pattern**

```typescript
// /src/lib/transaction.ts
import { db } from './db';

export async function withTransaction<T>(
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Usage: Atomic wallet + job creation
await withTransaction(async (tx) => {
  // Deduct from wallet
  await tx.query(
    'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
    [amount, userId]
  );

  // Create job record
  await tx.query(
    'INSERT INTO jobs (id, user_id, status) VALUES ($1, $2, $3)',
    [jobId, userId, 'pending']
  );

  // Create receipt
  await tx.query(
    'INSERT INTO receipts (job_id, amount, type) VALUES ($1, $2, $3)',
    [jobId, amount, 'charge']
  );
});
```

---

## 5. Frontend Improvements

### 5.1 Component Library Creation

**Current State:** No standardized component library; inline styles everywhere

**Recommended: Create UI Component Library**

```
/frontend/components/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
│   ├── Input.tsx
│   ├── TextArea.tsx
│   ├── Select.tsx
│   └── index.ts
├── Card/
│   ├── Card.tsx
│   └── index.ts
├── Modal/
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   └── index.ts
├── Toast/
│   ├── Toast.tsx
│   ├── ToastProvider.tsx
│   └── useToast.ts
├── Skeleton/
│   ├── Skeleton.tsx
│   └── index.ts
├── Table/
│   ├── Table.tsx
│   ├── TablePagination.tsx
│   └── index.ts
└── index.ts                    # Barrel export
```

**Button Component Example:**
```typescript
// /components/ui/Button/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-input font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent/90 shadow-sm',
        secondary: 'bg-surface border border-border text-text-primary hover:bg-bg',
        ghost: 'hover:bg-bg text-text-secondary',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 5.2 Custom Hooks Library

**Current State:** Only 4 custom hooks for entire application

**Recommended: Expand Hook Library**

```typescript
// /src/hooks/useAsync.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
    isSuccess: false,
    isError: false,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          data: null,
          error: err as Error,
          isLoading: false,
          isSuccess: false,
          isError: true,
        });
      }
    }
  }, [asyncFn]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();
    return () => { mountedRef.current = false; };
  }, [execute, immediate]);

  return { ...state, execute };
}

// /src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// /src/hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}

// /src/hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// /src/hooks/useCopyToClipboard.ts
export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return [copied, copy];
}
```

### 5.3 State Management with Zustand

**Current State:** 37 useState in single component, no global state

**Recommended: Zustand for Global State**

```typescript
// /src/stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: User | null;
  wallet: WalletBalance | null;
  preferences: UserPreferences | null;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setWallet: (wallet: WalletBalance | null) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      wallet: null,
      preferences: null,
      isLoading: true,

      setUser: (user) => set({ user, isLoading: false }),
      setWallet: (wallet) => set({ wallet }),
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: state.preferences
            ? { ...state.preferences, ...prefs }
            : (prefs as UserPreferences),
        })),
      logout: () => set({ user: null, wallet: null, preferences: null }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

// /src/stores/generationStore.ts
interface GenerationState {
  form: {
    prompt: string;
    negativePrompt: string;
    engine: string | null;
    mode: Mode;
    duration: number;
    resolution: string;
    aspectRatio: string;
    iterations: number;
  };
  assets: Record<string, ComposerAttachment[]>;
  pricing: PricingSnapshot | null;
  preflight: PreflightResponse | null;
  isGenerating: boolean;

  // Actions
  setPrompt: (prompt: string) => void;
  setEngine: (engine: string) => void;
  setMode: (mode: Mode) => void;
  updateForm: (updates: Partial<GenerationState['form']>) => void;
  addAsset: (field: string, asset: ComposerAttachment) => void;
  removeAsset: (field: string, index: number) => void;
  setPricing: (pricing: PricingSnapshot | null) => void;
  reset: () => void;
}

const initialForm = {
  prompt: '',
  negativePrompt: '',
  engine: null,
  mode: 't2v' as Mode,
  duration: 5,
  resolution: '720p',
  aspectRatio: '16:9',
  iterations: 1,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  form: initialForm,
  assets: {},
  pricing: null,
  preflight: null,
  isGenerating: false,

  setPrompt: (prompt) =>
    set((state) => ({ form: { ...state.form, prompt } })),
  setEngine: (engine) =>
    set((state) => ({ form: { ...state.form, engine } })),
  setMode: (mode) =>
    set((state) => ({ form: { ...state.form, mode } })),
  updateForm: (updates) =>
    set((state) => ({ form: { ...state.form, ...updates } })),
  addAsset: (field, asset) =>
    set((state) => ({
      assets: {
        ...state.assets,
        [field]: [...(state.assets[field] || []), asset],
      },
    })),
  removeAsset: (field, index) =>
    set((state) => ({
      assets: {
        ...state.assets,
        [field]: state.assets[field]?.filter((_, i) => i !== index) || [],
      },
    })),
  setPricing: (pricing) => set({ pricing }),
  reset: () => set({ form: initialForm, assets: {}, pricing: null }),
}));
```

### 5.4 Form Handling with React Hook Form

**Current State:** Manual onChange handlers for every field

**Recommended: React Hook Form + Zod**

```typescript
// /src/lib/schemas/generation.ts
import { z } from 'zod';

export const generationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  negativePrompt: z.string().max(1000).optional(),
  engine: z.string().min(1, 'Engine is required'),
  mode: z.enum(['t2v', 'i2v', 'v2v', 't2i']),
  duration: z.number().min(2).max(60),
  resolution: z.enum(['480p', '720p', '1080p', '4k']),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5', '3:2']),
  iterations: z.number().min(1).max(10),
});

export type GenerationFormData = z.infer<typeof generationSchema>;

// /components/GenerationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function GenerationForm({ onSubmit }: { onSubmit: (data: GenerationFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<GenerationFormData>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      prompt: '',
      mode: 't2v',
      duration: 5,
      resolution: '720p',
      aspectRatio: '16:9',
      iterations: 1,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          {...register('prompt')}
          className={errors.prompt ? 'border-red-500' : ''}
        />
        {errors.prompt && (
          <span className="text-red-500 text-sm">{errors.prompt.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="engine">Engine</label>
        <select {...register('engine')}>
          <option value="">Select engine</option>
          {/* Engine options */}
        </select>
        {errors.engine && (
          <span className="text-red-500 text-sm">{errors.engine.message}</span>
        )}
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        Generate
      </Button>
    </form>
  );
}
```

### 5.5 Data Fetching with TanStack Query

**Current State:** SWR with inconsistent patterns

**Recommended: TanStack Query for Complex Data**

```typescript
// /src/lib/queries/jobs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => fetchJobs(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => fetchJob(jobId),
    enabled: !!jobId,
    refetchInterval: (data) =>
      data?.status === 'pending' ? 3000 : false, // Poll while pending
  });
}

export function useGenerateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateVideo,
    onSuccess: (newJob) => {
      // Add to cache immediately (optimistic update)
      queryClient.setQueryData(jobKeys.detail(newJob.id), newJob);

      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
    onError: (error) => {
      // Handle error (show toast, etc.)
      console.error('Generation failed:', error);
    },
  });
}

// Usage in component
function GenerateWorkspace() {
  const { mutate: generate, isPending, error } = useGenerateVideo();

  const handleSubmit = (data: GenerationFormData) => {
    generate(data);
  };

  return (
    <GenerationForm onSubmit={handleSubmit} />
  );
}
```

### 5.6 Internationalization Improvements

**Current State:** `next-intl` with 3 languages

**Recommended Improvements:**

```typescript
// /src/lib/i18n/useTranslation.ts
// Wrapper hook with better typing
import { useTranslations as useNextIntlTranslations } from 'next-intl';

type TranslationKeys = keyof typeof import('@/messages/en.json');

export function useTranslation(namespace?: string) {
  const t = useNextIntlTranslations(namespace);

  return {
    t,
    // Helper for pluralization
    plural: (key: string, count: number) =>
      t(key, { count }),
    // Helper for interpolation
    format: (key: string, values: Record<string, string | number>) =>
      t(key, values),
  };
}

// /messages/en.json - Improved structure
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "confirm": "Confirm"
  },
  "generation": {
    "title": "Generate Video",
    "prompt": {
      "label": "Describe your video",
      "placeholder": "A serene mountain landscape at sunset...",
      "error": {
        "required": "Please enter a prompt",
        "tooLong": "Prompt must be less than {max} characters"
      }
    },
    "engine": {
      "label": "AI Engine",
      "select": "Select an engine"
    },
    "submit": "Generate",
    "estimatedCost": "Estimated cost: {price}",
    "progress": {
      "pending": "Waiting to start...",
      "running": "Generating ({progress}%)...",
      "completed": "Video ready!",
      "failed": "Generation failed"
    }
  },
  "billing": {
    "balance": "Balance: {amount}",
    "topup": "Add funds",
    "history": "Transaction history"
  }
}
```

### 5.7 Error Boundaries

**Current State:** No error boundaries

**Recommended: Comprehensive Error Handling**

```typescript
// /src/components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-text-secondary mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 5.8 Loading States & Skeletons

**Current State:** Inconsistent loading indicators

**Recommended: Unified Loading System**

```typescript
// /src/components/ui/Skeleton/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-border/50 rounded';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  ));

  return count === 1 ? items[0] : <div className="space-y-2">{items}</div>;
}

// Job card skeleton
export function JobCardSkeleton() {
  return (
    <div className="rounded-card border border-border p-4 space-y-3">
      <Skeleton variant="rectangular" height={180} />
      <Skeleton width="60%" />
      <Skeleton width="40%" />
      <div className="flex gap-2">
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
}

// Jobs list with loading state
function JobsList() {
  const { data: jobs, isLoading } = useJobs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs?.map((job) => <JobCard key={job.id} job={job} />)}
    </div>
  );
}
```

---

## 6. UI/UX Enhancements

### 6.1 Design System Standardization

**Current Issues:**
- Multiple button styles (4+ variants inline)
- Inconsistent input styling
- Hardcoded colors mixed with theme colors
- No design tokens

**Recommended: Design Token System**

```typescript
// /src/styles/tokens.ts
export const tokens = {
  colors: {
    // Brand
    primary: {
      50: '#f0f4ff',
      100: '#e0e7ff',
      500: '#4F5D75',
      600: '#3d4a5f',
      700: '#2b374a',
    },
    // Semantic
    success: {
      light: '#dcfce7',
      DEFAULT: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      light: '#fef3c7',
      DEFAULT: '#f59e0b',
      dark: '#b45309',
    },
    error: {
      light: '#fee2e2',
      DEFAULT: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      light: '#e0f2fe',
      DEFAULT: '#0ea5e9',
      dark: '#0369a1',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 6px 16px rgba(16, 24, 40, 0.06)',
  },
  typography: {
    fontFamily: {
      sans: 'Geist, Inter, system-ui, sans-serif',
      mono: 'Geist Mono, monospace',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
    },
  },
};
```

### 6.2 Accessibility Improvements

**Current Gaps:**
- Some buttons missing aria-labels
- Modal keyboard traps not implemented
- Focus management inconsistent
- No skip navigation links

**Recommended Improvements:**

```typescript
// 1. Skip Navigation Link
// /components/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}

// 2. Focus Trap for Modals
// /src/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

// 3. Announce for Screen Readers
// /src/hooks/useAnnounce.ts
export function useAnnounce() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  return announce;
}

// 4. Accessible Form Labels
// /components/ui/FormField.tsx
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  required,
  description,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {description && (
        <p id={descriptionId} className="text-sm text-text-secondary">
          {description}
        </p>
      )}
      <div
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : undefined}
      >
        {children}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### 6.3 Responsive Design Fixes

**Current Issues:**
- EngineSelect not fully responsive
- Tables don't have mobile alternatives
- Some layouts break on tablets

**Recommended Fixes:**

```typescript
// 1. Responsive Table Component
// /components/ui/Table/ResponsiveTable.tsx
interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

export function ResponsiveTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
}: {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
}) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-medium text-text-secondary"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={String(row[keyField])} className="border-b border-border/50">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-sm">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div
            key={String(row[keyField])}
            className="rounded-card border border-border p-4 space-y-2"
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={String(col.key)} className="flex justify-between">
                  <span className="text-sm text-text-secondary">{col.label}</span>
                  <span className="text-sm font-medium">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}

// 2. Responsive Grid Hook
// /src/hooks/useResponsiveColumns.ts
export function useResponsiveColumns() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  if (isMobile) return 1;
  if (isTablet) return 2;
  return 3;
}

// 3. Container Queries for Components
// /components/VideoCard.tsx
export function VideoCard({ video }: { video: Video }) {
  return (
    <div className="@container">
      <div className="flex flex-col @md:flex-row gap-4">
        <div className="w-full @md:w-48 aspect-video rounded-lg overflow-hidden">
          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-text-primary line-clamp-2">{video.title}</h3>
          <p className="text-sm text-text-secondary mt-1">{video.duration}s</p>
        </div>
      </div>
    </div>
  );
}
```

### 6.4 Animation & Micro-interactions

**Current State:** Basic transitions, some CSS animations

**Recommended: Enhanced Micro-interactions**

```typescript
// /src/lib/animations.ts
import { Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export const staggerChildren: Variants = {
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

export const scaleOnHover = {
  scale: 1.02,
  transition: { type: 'spring', stiffness: 400, damping: 10 },
};

// /components/AnimatedList.tsx
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedList<T extends { id: string }>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            variants={slideUp}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderItem(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}

// Success state animation
export function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
    >
      <motion.svg
        className="w-16 h-16 text-green-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
      </motion.svg>
    </motion.div>
  );
}
```

### 6.5 Toast/Notification System

**Current State:** No unified notification system

**Recommended: Toast System**

```typescript
// /src/stores/toastStore.ts
import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper hook
export function useToast() {
  const addToast = useToastStore((state) => state.addToast);

  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  };
}

// /components/ui/Toast/ToastContainer.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-[400px] ${colors[toast.type]}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm mt-1 opacity-90">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

### 6.6 Empty States

**Current State:** No consistent empty state designs

**Recommended: Empty State Components**

```typescript
// /components/ui/EmptyState.tsx
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-text-secondary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-sm mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

// Usage examples
function NoJobsState() {
  return (
    <EmptyState
      icon={Video}
      title="No videos yet"
      description="Create your first AI-generated video by clicking the button below."
      action={{
        label: 'Generate Video',
        onClick: () => router.push('/generate'),
      }}
    />
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any videos matching "${query}". Try adjusting your search.`}
    />
  );
}
```

### 6.7 Progress Indicators

**Current State:** Basic progress bar in ProcessingOverlay

**Recommended: Enhanced Progress System**

```typescript
// /components/ui/Progress.tsx
interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Progress({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  variant = 'default',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-accent',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-sm text-text-secondary">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-text-primary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-border/30 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          className={`h-full rounded-full ${variants[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Step Progress
interface Step {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

export function StepProgress({ steps }: { steps: Step[] }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.status === 'completed'
                  ? 'bg-accent border-accent text-white'
                  : step.status === 'current'
                  ? 'border-accent text-accent'
                  : step.status === 'error'
                  ? 'border-red-500 text-red-500'
                  : 'border-border text-text-secondary'
              }`}
            >
              {step.status === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : step.status === 'error' ? (
                <X className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                step.status === 'current'
                  ? 'font-medium text-text-primary'
                  : 'text-text-secondary'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="mx-4 w-12 h-0.5 bg-border" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

---

## 7. Feature Recommendations

### 7.1 New Features to Add

#### **User Experience Features**

| Feature | Description | Priority | Effort |
|---------|-------------|----------|--------|
| **Video Templates** | Pre-built templates for common use cases | High | 2 weeks |
| **Prompt Library** | Save and organize favorite prompts | High | 1 week |
| **Batch Processing** | Queue multiple videos at once | Medium | 2 weeks |
| **Video Editing** | Basic trim, crop, merge capabilities | Medium | 3 weeks |
| **Favorites/Bookmarks** | Star videos for quick access | Low | 3 days |
| **Video Collections** | Organize videos into folders | Medium | 1 week |
| **Sharing** | Public share links for videos | High | 1 week |
| **Collaboration** | Team workspaces | Low | 4 weeks |

#### **Generation Features**

| Feature | Description | Priority | Effort |
|---------|-------------|----------|--------|
| **Prompt Enhancement** | AI-powered prompt suggestions | High | 2 weeks |
| **Style Presets** | Predefined visual styles | High | 1 week |
| **Reference Images** | Upload style reference images | Medium | 2 weeks |
| **Audio Integration** | Add background music/voiceover | High | 3 weeks |
| **Frame Interpolation** | Smooth slow-motion effects | Low | 2 weeks |
| **Multi-language Prompts** | Translate prompts automatically | Medium | 1 week |
| **Negative Prompt Templates** | Common exclusion patterns | Low | 3 days |

#### **Business Features**

| Feature | Description | Priority | Effort |
|---------|-------------|----------|--------|
| **API Access** | Developer API for integration | High | 3 weeks |
| **Webhooks** | Notify external systems on completion | Medium | 1 week |
| **Usage Analytics** | Detailed generation statistics | Medium | 2 weeks |
| **Export Options** | Download in multiple formats | Medium | 1 week |
| **Watermark Settings** | Custom watermarks for free tier | Low | 3 days |
| **White-label** | Custom branding for enterprise | Low | 4 weeks |

### 7.2 Feature Implementation: Prompt Library

```typescript
// /src/stores/promptLibraryStore.ts
interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  engine?: string;
  settings?: Partial<GenerationSettings>;
  tags: string[];
  createdAt: Date;
  usageCount: number;
}

interface PromptLibraryStore {
  prompts: SavedPrompt[];
  addPrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'usageCount'>) => void;
  updatePrompt: (id: string, updates: Partial<SavedPrompt>) => void;
  deletePrompt: (id: string) => void;
  usePrompt: (id: string) => SavedPrompt | undefined;
}

export const usePromptLibrary = create<PromptLibraryStore>()(
  persist(
    (set, get) => ({
      prompts: [],

      addPrompt: (prompt) => {
        const newPrompt: SavedPrompt = {
          ...prompt,
          id: nanoid(),
          createdAt: new Date(),
          usageCount: 0,
        };
        set((state) => ({ prompts: [newPrompt, ...state.prompts] }));
      },

      updatePrompt: (id, updates) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
        }));
      },

      usePrompt: (id) => {
        const prompt = get().prompts.find((p) => p.id === id);
        if (prompt) {
          set((state) => ({
            prompts: state.prompts.map((p) =>
              p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p
            ),
          }));
        }
        return prompt;
      },
    }),
    { name: 'prompt-library' }
  )
);

// /components/PromptLibrary.tsx
export function PromptLibrary({ onSelect }: { onSelect: (prompt: SavedPrompt) => void }) {
  const { prompts, deletePrompt } = usePromptLibrary();
  const [search, setSearch] = useState('');

  const filtered = prompts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search prompts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search className="w-4 h-4" />}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No saved prompts"
          description="Save your favorite prompts for quick access."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((prompt) => (
            <div
              key={prompt.id}
              className="p-4 rounded-card border border-border hover:border-accent/50 cursor-pointer transition-colors"
              onClick={() => onSelect(prompt)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{prompt.title}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePrompt(prompt.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                {prompt.prompt}
              </p>
              <div className="flex gap-2 mt-2">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-bg rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 7.3 Feature Implementation: Video Sharing

```typescript
// /src/lib/sharing.ts
interface ShareLink {
  id: string;
  videoId: string;
  userId: string;
  expiresAt: Date | null;
  viewCount: number;
  password?: string;
  createdAt: Date;
}

// API Route: /api/share/route.ts
export async function POST(req: Request) {
  const { videoId, expiresIn, password } = await req.json();
  const userId = await getAuthUserId(req);

  // Verify video ownership
  const video = await getVideo(videoId);
  if (video.userId !== userId) {
    return error('FORBIDDEN', 'You do not own this video', 403);
  }

  // Create share link
  const shareId = nanoid(12);
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  await db.insert(shareLinks).values({
    id: shareId,
    videoId,
    userId,
    expiresAt,
    password: password ? await hash(password) : null,
    viewCount: 0,
    createdAt: new Date(),
  });

  return success({
    shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/s/${shareId}`,
    expiresAt,
  });
}

// Page: /app/s/[shareId]/page.tsx
export default async function SharedVideoPage({
  params,
}: {
  params: { shareId: string };
}) {
  const share = await getShareLink(params.shareId);

  if (!share) {
    return <NotFound />;
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    return <ExpiredLink />;
  }

  const video = await getVideo(share.videoId);

  // Increment view count
  await incrementShareViewCount(share.id);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <video
          src={video.url}
          controls
          autoPlay
          className="w-full rounded-lg shadow-lg"
        />
        <div className="mt-4">
          <h1 className="text-xl font-semibold">{video.title || 'Untitled Video'}</h1>
          <p className="text-text-secondary mt-2">{video.prompt}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. Firebase Migration Strategy

### 8.1 Current vs Target Architecture

```
CURRENT STACK                    TARGET STACK
─────────────────               ─────────────────
Supabase Auth        ──────►    Firebase Auth
PostgreSQL (Neon)    ──────►    Firestore
AWS S3               ──────►    Firebase Storage
Next.js API Routes   ──────►    Next.js + Firebase Admin SDK
Supabase RLS         ──────►    Firestore Security Rules
```

### 8.2 Firebase Project Setup

```bash
# Install Firebase SDK
npm install firebase firebase-admin

# Initialize Firebase in project
npx firebase init

# Select:
# - Firestore
# - Authentication
# - Storage
# - Hosting (optional, using Vercel)
# - Functions (optional)
```

### 8.3 Firebase Configuration

```typescript
// /src/lib/firebase/client.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// /src/lib/firebase/admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

const adminApp = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
```

### 8.4 Firestore Schema Design

```typescript
// /src/lib/firebase/schema.ts
// Collection: users
interface UserDoc {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  role: 'user' | 'admin';
  preferences: {
    currency: string;
    indexVideos: boolean;
    marketingEmails: boolean;
  };
  wallet: {
    balance: number; // cents
    currency: string;
  };
}

// Collection: jobs
interface JobDoc {
  id: string;
  userId: string;
  engine: string;
  mode: 't2v' | 'i2v' | 'v2v' | 't2i';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  prompt: string;
  negativePrompt?: string;
  settings: {
    duration: number;
    resolution: string;
    aspectRatio: string;
  };
  inputAssets: string[]; // Storage URLs
  outputUrl?: string;
  thumbnailUrl?: string;
  pricing: {
    amount: number;
    currency: string;
  };
  providerJobId?: string;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// Collection: receipts
interface ReceiptDoc {
  id: string;
  userId: string;
  type: 'topup' | 'charge' | 'refund';
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  jobId?: string;
  createdAt: Timestamp;
}

// Subcollection: users/{userId}/notifications
interface NotificationDoc {
  id: string;
  type: 'job_complete' | 'job_failed' | 'low_balance' | 'promo';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}
```

### 8.5 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();

      // User's notifications subcollection
      match /notifications/{notificationId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Jobs collection
    match /jobs/{jobId} {
      allow read: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin() ||
        (isAuthenticated() && resource.data.userId == request.auth.uid);
      allow delete: if isAdmin();
    }

    // Receipts collection
    match /receipts/{receiptId} {
      allow read: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if false; // Server-only
      allow update, delete: if false;
    }

    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

### 8.6 Firebase Storage Rules

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User uploads (reference images)
    match /users/{userId}/uploads/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024 // 10MB limit
        && request.resource.contentType.matches('image/.*');
    }

    // Generated videos (server-written)
    match /videos/{jobId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if false; // Server-only via Admin SDK
    }

    // Thumbnails
    match /thumbnails/{jobId}.jpg {
      allow read: if true; // Public thumbnails
      allow write: if false; // Server-only
    }
  }
}
```

### 8.7 Authentication Migration

```typescript
// /src/hooks/useFirebaseAuth.ts
import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...firebaseUser, ...userDoc.data() } as any);
        } else {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      email: newUser.email,
      displayName: null,
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'user',
      preferences: {
        currency: 'eur',
        indexVideos: true,
        marketingEmails: false,
      },
      wallet: {
        balance: 0,
        currency: 'eur',
      },
    });

    return newUser;
  };

  const signOut = () => firebaseSignOut(auth);

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
```

### 8.8 Data Migration Script

```typescript
// /scripts/migrate-to-firebase.ts
import { createClient } from '@supabase/supabase-js';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateUsers() {
  console.log('Migrating users...');

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) throw error;

  const batch = adminDb.batch();

  for (const user of users) {
    const userRef = adminDb.collection('users').doc(user.id);
    batch.set(userRef, {
      uid: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: Timestamp.fromDate(new Date(user.created_at)),
      updatedAt: Timestamp.fromDate(new Date()),
      role: 'user',
      preferences: {
        currency: user.currency || 'eur',
        indexVideos: user.index_videos ?? true,
        marketingEmails: user.marketing_emails ?? false,
      },
      wallet: {
        balance: user.wallet_balance || 0,
        currency: user.wallet_currency || 'eur',
      },
    });
  }

  await batch.commit();
  console.log(`Migrated ${users.length} users`);
}

async function migrateJobs() {
  console.log('Migrating jobs...');

  const { data: jobs, error } = await supabase
    .from('app_jobs')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Process in batches of 500 (Firestore limit)
  for (let i = 0; i < jobs.length; i += 500) {
    const batch = adminDb.batch();
    const batchJobs = jobs.slice(i, i + 500);

    for (const job of batchJobs) {
      const jobRef = adminDb.collection('jobs').doc(job.job_id);
      batch.set(jobRef, {
        id: job.job_id,
        userId: job.user_id,
        engine: job.engine_id,
        mode: job.mode,
        status: job.status,
        progress: job.progress || 0,
        prompt: job.prompt,
        negativePrompt: job.negative_prompt,
        settings: {
          duration: job.duration_sec,
          resolution: job.resolution,
          aspectRatio: job.aspect_ratio,
        },
        inputAssets: job.input_assets || [],
        outputUrl: job.video_url,
        thumbnailUrl: job.thumb_url,
        pricing: job.pricing_snapshot || {},
        providerJobId: job.provider_job_id,
        error: job.error_message,
        createdAt: Timestamp.fromDate(new Date(job.created_at)),
        updatedAt: Timestamp.fromDate(new Date(job.updated_at || job.created_at)),
        completedAt: job.completed_at
          ? Timestamp.fromDate(new Date(job.completed_at))
          : null,
      });
    }

    await batch.commit();
    console.log(`Migrated jobs ${i + 1} to ${i + batchJobs.length}`);
  }

  console.log(`Migrated ${jobs.length} total jobs`);
}

async function main() {
  try {
    await migrateUsers();
    await migrateJobs();
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
```

### 8.9 Migration Checklist

```markdown
## Firebase Migration Checklist

### Phase 1: Setup (Week 1)
- [ ] Create Firebase project
- [ ] Configure Firebase Authentication
- [ ] Set up Firestore database
- [ ] Configure Firebase Storage
- [ ] Install Firebase SDKs
- [ ] Set up environment variables
- [ ] Create Firestore indexes
- [ ] Write security rules

### Phase 2: Auth Migration (Week 2)
- [ ] Implement Firebase Auth hooks
- [ ] Update login/signup components
- [ ] Migrate session handling
- [ ] Update middleware for Firebase tokens
- [ ] Test authentication flows
- [ ] Implement password reset

### Phase 3: Database Migration (Weeks 3-4)
- [ ] Create Firestore schema
- [ ] Write migration scripts
- [ ] Migrate user data
- [ ] Migrate job data
- [ ] Migrate receipts
- [ ] Update all API routes
- [ ] Update React hooks for Firestore
- [ ] Test CRUD operations

### Phase 4: Storage Migration (Week 5)
- [ ] Configure Firebase Storage
- [ ] Migrate existing S3 files
- [ ] Update upload functions
- [ ] Update video/image URLs
- [ ] Test file operations

### Phase 5: Testing & Deployment (Week 6)
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Gradual rollout
- [ ] Monitor for issues
- [ ] Deprecate Supabase/Neon
```

---

## 9. Security Improvements

### 9.1 Security Audit Findings

| Issue | Severity | Status | Fix Effort |
|-------|----------|--------|------------|
| Missing rate limiting | 🔴 Critical | Open | 3-5 days |
| SSRF vulnerability in image probing | 🔴 Critical | Open | 1-2 days |
| Webhook timing attack | 🟠 High | Open | 1 hour |
| No input sanitization on prompts | 🟠 High | Open | 2 days |
| Admin impersonation without MFA | 🟡 Medium | Open | 1 week |
| No API key rotation | 🟡 Medium | Open | 3 days |
| Session fixation risk | 🟡 Medium | Open | 2 days |
| Missing CSP headers | 🟡 Medium | Open | 1 day |
| No audit logging | 🟡 Medium | Open | 1 week |

### 9.2 Content Security Policy

```typescript
// /middleware.ts - Add CSP headers
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.s3.amazonaws.com https://*.supabase.co https://*.fal.ai;
  font-src 'self';
  connect-src 'self' https://*.supabase.co https://*.fal.ai https://api.stripe.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}
```

### 9.3 Audit Logging

```typescript
// /src/lib/audit.ts
interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
  const auditEvent: AuditEvent = {
    ...event,
    id: nanoid(),
    timestamp: new Date(),
  };

  // Store in database
  await db.insert(auditLogs).values(auditEvent);

  // Alert on sensitive actions
  const sensitiveActions = [
    'admin.impersonate',
    'admin.refund',
    'admin.delete_user',
    'auth.failed_login',
    'payment.large_topup',
  ];

  if (sensitiveActions.includes(event.action)) {
    await sendSlackAlert({
      channel: '#security-alerts',
      text: `Sensitive action: ${event.action} by ${event.userId || 'anonymous'}`,
      attachments: [{ fields: Object.entries(event.metadata).map(([k, v]) => ({ title: k, value: String(v) })) }],
    });
  }
}

// Usage in API routes
export async function POST(req: Request) {
  const userId = await getAuthUserId(req);
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  try {
    const result = await processRequest(req);

    await logAuditEvent({
      userId,
      action: 'video.generate',
      resource: 'job',
      resourceId: result.jobId,
      ipAddress: ip,
      userAgent,
      metadata: { engine: result.engine, duration: result.duration },
      status: 'success',
    });

    return success(result);
  } catch (error) {
    await logAuditEvent({
      userId,
      action: 'video.generate',
      resource: 'job',
      resourceId: null,
      ipAddress: ip,
      userAgent,
      metadata: { error: error.message },
      status: 'failure',
      errorMessage: error.message,
    });

    throw error;
  }
}
```

### 9.4 Input Validation & Sanitization

```typescript
// /src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Prompt sanitization
export function sanitizePrompt(prompt: string): string {
  // Remove HTML/script tags
  let clean = DOMPurify.sanitize(prompt, { ALLOWED_TAGS: [] });

  // Remove potential injection patterns
  clean = clean
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/\x00/g, '') // Remove null bytes
    .trim();

  return clean;
}

// File validation
export const fileSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  type: z.string().regex(/^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm|mov))$/),
});

// URL validation (prevent SSRF)
export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false;

    // Block private IP ranges
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      return false;
    }

    // Block internal domains
    const blockedDomains = ['internal.', 'admin.', 'api.', 'localhost'];
    if (blockedDomains.some(d => hostname.includes(d))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
```

---

## 10. Performance Optimizations

### 10.1 Bundle Size Analysis

**Current Issues:**
- Large component bundles (4,848 lines in single file)
- No code splitting for admin routes
- Unused dependencies included

**Recommendations:**

```typescript
// next.config.js - Enable bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Existing config...
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
    ],
  },
});
```

### 10.2 Image Optimization

```typescript
// Use next/image with proper sizing
import Image from 'next/image';

// Before (bad)
<img src={thumbnail} alt="" className="w-full h-auto" />

// After (good)
<Image
  src={thumbnail}
  alt=""
  width={320}
  height={180}
  placeholder="blur"
  blurDataURL={placeholderBlur}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### 10.3 Code Splitting

```typescript
// Lazy load heavy components
const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  loading: () => <DashboardSkeleton />,
});

const MediaLightbox = dynamic(() => import('@/components/MediaLightbox'), {
  ssr: false,
});

const PricingCalculator = dynamic(() => import('@/components/PricingCalculator'));
```

### 10.4 Database Query Optimization

```typescript
// Add indexes for common queries
// /supabase/migrations/add_indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_user_id_created_at
  ON app_jobs (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status
  ON app_jobs (status) WHERE status IN ('pending', 'running');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receipts_user_id
  ON app_receipts (user_id, created_at DESC);

// Use connection pooling
// Already using Neon pooler - ensure pgbouncer mode
```

### 10.5 Caching Strategy

```typescript
// /src/lib/cache-headers.ts
export const cacheHeaders = {
  // Static assets - long cache
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  // API responses - short cache with revalidation
  api: {
    'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
  },
  // User-specific - no cache
  private: {
    'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  },
  // Public pages - moderate cache
  public: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  },
};

// Usage in API route
export async function GET(req: Request) {
  const data = await fetchPublicData();
  return Response.json(data, {
    headers: cacheHeaders.public,
  });
}
```

---

## 11. Technical Debt

### 11.1 Technical Debt Inventory

| Item | Description | Impact | Effort | Priority |
|------|-------------|--------|--------|----------|
| God component | 4,848 line workspace component | High | 3 weeks | 🔴 Critical |
| No memoization | Zero React.memo() in 100+ components | High | 1 week | 🔴 Critical |
| Props drilling | 4+ levels of prop passing | Medium | 2 weeks | 🟠 High |
| Inconsistent hooks | Only 4 custom hooks | Medium | 2 weeks | 🟠 High |
| No tests | Zero test coverage | High | 4 weeks | 🟠 High |
| Inline styles | Button/input styles scattered | Low | 1 week | 🟡 Medium |
| Console.log debugging | Scattered throughout code | Low | 2 days | 🟡 Medium |
| Magic numbers | Hardcoded values in code | Low | 3 days | 🟡 Medium |
| Dead code | Unused functions/components | Low | 2 days | 🟢 Low |
| Outdated dependencies | Some packages need updates | Low | 1 day | 🟢 Low |

### 11.2 Code Quality Metrics

**ESLint Issues:**
- 11 `eslint-disable-next-line` comments
- 2 `@ts-ignore` comments
- Several missing dependency array warnings

**TypeScript Strictness:**
- Strict mode enabled ✓
- Some `any` types in complex areas
- Missing return types on some functions

### 11.3 Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Major updates needed:
# - next: 14.2.5 → 15.x (breaking changes)
# - react: 18.3.1 → 19.x (when stable)
# - stripe: 14.24.0 → 17.x (API changes)

# Minor updates recommended:
npm update
```

---

## 12. Priority Roadmap

### Phase 1: Critical Fixes (Weeks 1-2)

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Add rate limiting | Backend | 3 | - |
| Fix SSRF vulnerability | Backend | 1 | - |
| Fix webhook timing attack | Backend | 0.5 | - |
| Add CSP headers | Backend | 0.5 | - |
| Add React.memo to top 5 components | Frontend | 3 | - |
| Split workspace component (Phase 1) | Frontend | 5 | - |

### Phase 2: Foundation (Weeks 3-4)

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Create Button component | Frontend | 2 | - |
| Create Input components | Frontend | 2 | - |
| Create Modal component | Frontend | 2 | - |
| Create Toast system | Frontend | 2 | - |
| Add environment validation | Backend | 2 | - |
| Implement structured logging | Backend | 3 | - |
| Add audit logging | Backend | 4 | Structured logging |

### Phase 3: Architecture (Weeks 5-8)

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Implement Zustand stores | Frontend | 5 | - |
| Create custom hooks library | Frontend | 5 | - |
| Add React Hook Form | Frontend | 3 | - |
| Complete workspace split | Frontend | 10 | Phase 1 split |
| Add Redis caching | Backend | 5 | - |
| Implement job queue | Backend | 5 | Redis |
| Add database transactions | Backend | 3 | - |

### Phase 4: Firebase Migration (Weeks 9-14)

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Firebase project setup | DevOps | 2 | - |
| Auth migration | Full Stack | 5 | Setup |
| Firestore schema | Backend | 3 | Setup |
| Data migration scripts | Backend | 5 | Schema |
| API route updates | Backend | 10 | Firestore |
| Storage migration | Backend | 5 | - |
| Testing & QA | QA | 5 | All above |

### Phase 5: Polish & Features (Weeks 15-18)

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Add test coverage (50%) | All | 15 | - |
| Implement prompt library | Frontend | 5 | Zustand |
| Add video sharing | Full Stack | 5 | - |
| Accessibility audit & fixes | Frontend | 5 | Components |
| Performance optimization | All | 5 | - |
| Documentation | All | 5 | - |

---

## Appendix A: Environment Variables

```bash
# Required for Production
DATABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FAL_API_KEY=
FAL_WEBHOOK_TOKEN=
FAL_POLL_TOKEN=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Firebase (After Migration)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=

# Optional
RESEND_API_KEY=
SLACK_WEBHOOK_URL=
NEXT_PUBLIC_CLARITY_ID=
NEXT_PUBLIC_GTM_ID=
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **T2V** | Text-to-Video generation |
| **I2V** | Image-to-Video generation |
| **V2V** | Video-to-Video transformation |
| **FAL.ai** | AI model provider for video generation |
| **Firestore** | Firebase NoSQL document database |
| **RLS** | Row-Level Security (Supabase/Postgres) |
| **SWR** | Stale-While-Revalidate (data fetching) |
| **SSRF** | Server-Side Request Forgery |
| **CSP** | Content Security Policy |

---

## Appendix C: Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Run ESLint
npm run test                   # Run tests (after setup)

# Database
npm run migrate:up             # Run migrations
npm run migrate:down           # Rollback migration
npm run db:seed                # Seed database

# Firebase
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions

# Analysis
ANALYZE=true npm run build     # Bundle analysis
npm run lighthouse             # Performance audit
```

---

**Document End**

*Last Updated: December 30, 2025*
*Version: 1.0*
*Author: Claude Code Analysis*

