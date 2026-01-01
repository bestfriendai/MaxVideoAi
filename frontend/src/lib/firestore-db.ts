import { getFirebaseFirestore, isFirebaseAdminConfigured } from '@/server/firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export function isFirestoreConfigured(): boolean {
  return isFirebaseAdminConfigured();
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirebaseFirestore();
  }
  return db;
}

// Helper to convert Firestore Timestamp to ISO string
export function serializeTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  // Handle Firestore Timestamp objects
  if (typeof value === 'object' && value !== null) {
    // Check for toDate method (Firestore Timestamp)
    if ('toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    // Check for _seconds/_nanoseconds (raw Firestore Timestamp)
    if ('_seconds' in value && typeof (value as { _seconds: number })._seconds === 'number') {
      const seconds = (value as { _seconds: number })._seconds;
      const nanoseconds = (value as { _nanoseconds?: number })._nanoseconds ?? 0;
      return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString();
    }
  }
  return new Date().toISOString();
}

// Jobs Collection
export interface JobDocument {
  jobId: string;
  userId: string;
  engineId: string;
  engineLabel: string;
  durationSec: number;
  prompt: string;
  thumbUrl: string | null;
  videoUrl: string | null;
  aspectRatio: string | null;
  hasAudio: boolean;
  canUpscale: boolean;
  previewFrame: string | null;
  status: 'pending' | 'completed' | 'failed';
  progress: number;
  message: string | null;
  createdAt: FirebaseFirestore.Timestamp | Date | string;
  updatedAt?: FirebaseFirestore.Timestamp | Date | string;
  paymentStatus: string;
  finalPriceCents?: number;
  currency?: string;
  batchId?: string | null;
  groupId?: string | null;
  iterationIndex?: number | null;
  iterationCount?: number | null;
  renderIds?: string[] | null;
  heroRenderId?: string | null;
  localKey?: string | null;
  etaSeconds?: number | null;
  etaLabel?: string | null;
  providerJobId?: string | null;
  visibility?: 'public' | 'private';
  indexable?: boolean;
}

export async function getJobById(jobId: string, userId?: string): Promise<JobDocument | null> {
  try {
    const db = getDb();
    const docRef = db.collection('jobs').doc(jobId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as JobDocument;

    // Verify ownership if userId provided
    if (userId && data.userId !== userId) {
      return null;
    }

    // Serialize timestamps to ISO strings
    return {
      ...data,
      jobId: doc.id,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
    };
  } catch (error) {
    console.error('[firestore] getJobById failed:', error);
    return null;
  }
}

export async function getJobsByUserId(userId: string, limit = 24): Promise<JobDocument[]> {
  try {
    const db = getDb();
    const snapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as JobDocument;
      return {
        ...data,
        jobId: doc.id,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
      };
    });
  } catch (error) {
    console.error('[firestore] getJobsByUserId failed:', error);
    return [];
  }
}

export async function createJob(job: Omit<JobDocument, 'createdAt' | 'updatedAt'>): Promise<string> {
  const db = getDb();
  const docRef = db.collection('jobs').doc(job.jobId);
  await docRef.set({
    ...job,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return job.jobId;
}

export async function updateJob(jobId: string, updates: Partial<JobDocument>): Promise<void> {
  const db = getDb();
  const docRef = db.collection('jobs').doc(jobId);
  await docRef.update({
    ...updates,
    updatedAt: new Date(),
  });
}

// Wallet/Receipts Collection
export interface ReceiptDocument {
  id?: string;
  userId: string;
  type: 'topup' | 'charge' | 'refund';
  amountCents: number;
  currency: string;
  description: string;
  jobId?: string | null;
  pricingSnapshot?: Record<string, unknown>;
  createdAt: FirebaseFirestore.Timestamp | Date | string;
}

export async function getWalletBalance(userId: string): Promise<{ balance: number; currency: string }> {
  try {
    const db = getDb();
    const snapshot = await db.collection('receipts')
      .where('userId', '==', userId)
      .get();

    let topups = 0;
    let charges = 0;
    let refunds = 0;

    snapshot.docs.forEach(doc => {
      const receipt = doc.data() as ReceiptDocument;
      const amount = receipt.amountCents ?? 0;
      if (receipt.type === 'topup') topups += amount;
      if (receipt.type === 'charge') charges += amount;
      if (receipt.type === 'refund') refunds += amount;
    });

    const balanceCents = Math.max(0, topups + refunds - charges);
    return { balance: balanceCents / 100, currency: 'USD' };
  } catch (error) {
    console.error('[firestore] getWalletBalance failed:', error);
    return { balance: 0, currency: 'USD' };
  }
}

export async function createReceipt(receipt: Omit<ReceiptDocument, 'createdAt'>): Promise<string> {
  const db = getDb();
  const docRef = db.collection('receipts').doc();
  await docRef.set({
    ...receipt,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function chargeWallet(params: {
  userId: string;
  amountCents: number;
  currency: string;
  description: string;
  jobId: string;
}): Promise<{ ok: true; newBalanceCents: number } | { ok: false; balanceCents: number }> {
  const { balance } = await getWalletBalance(params.userId);
  const balanceCents = Math.round(balance * 100);

  if (balanceCents < params.amountCents) {
    return { ok: false, balanceCents };
  }

  await createReceipt({
    userId: params.userId,
    type: 'charge',
    amountCents: params.amountCents,
    currency: params.currency,
    description: params.description,
    jobId: params.jobId,
  });

  return { ok: true, newBalanceCents: balanceCents - params.amountCents };
}

export async function refundWallet(params: {
  userId: string;
  amountCents: number;
  currency: string;
  description: string;
  jobId: string;
}): Promise<void> {
  await createReceipt({
    userId: params.userId,
    type: 'refund',
    amountCents: params.amountCents,
    currency: params.currency,
    description: params.description,
    jobId: params.jobId,
  });
}

// User Preferences Collection
export interface UserPreferencesDocument {
  userId: string;
  defaultSharePublic: boolean;
  defaultAllowIndex: boolean;
  onboardingDone: boolean;
  updatedAt?: FirebaseFirestore.Timestamp | Date;
}

export async function getUserPreferences(userId: string): Promise<UserPreferencesDocument> {
  try {
    const db = getDb();
    const docRef = db.collection('userPreferences').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // Return defaults and create the document
      const defaults: UserPreferencesDocument = {
        userId,
        defaultSharePublic: true,
        defaultAllowIndex: true,
        onboardingDone: false,
      };
      await docRef.set({ ...defaults, updatedAt: new Date() });
      return defaults;
    }

    return doc.data() as UserPreferencesDocument;
  } catch (error) {
    console.error('[firestore] getUserPreferences failed:', error);
    return {
      userId,
      defaultSharePublic: true,
      defaultAllowIndex: true,
      onboardingDone: false,
    };
  }
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferencesDocument, 'userId'>>
): Promise<UserPreferencesDocument> {
  const db = getDb();
  const docRef = db.collection('userPreferences').doc(userId);

  await docRef.set(
    { ...updates, userId, updatedAt: new Date() },
    { merge: true }
  );

  return getUserPreferences(userId);
}

// Member Status
export async function getMemberStatus(userId: string): Promise<{
  tier: string;
  savingsPct: number;
  spent30: number;
  spentToday: number;
}> {
  try {
    const db = getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const snapshot = await db.collection('receipts')
      .where('userId', '==', userId)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    let spent30 = 0;
    let spentToday = 0;

    snapshot.docs.forEach(doc => {
      const receipt = doc.data() as ReceiptDocument;
      const amount = receipt.amountCents ?? 0;
      // Parse createdAt from various formats
      let createdAt: Date;
      if (receipt.createdAt instanceof Date) {
        createdAt = receipt.createdAt;
      } else if (typeof receipt.createdAt === 'string') {
        createdAt = new Date(receipt.createdAt);
      } else if (receipt.createdAt && typeof receipt.createdAt === 'object' && 'toDate' in receipt.createdAt) {
        createdAt = (receipt.createdAt as { toDate: () => Date }).toDate();
      } else if (receipt.createdAt && typeof receipt.createdAt === 'object' && '_seconds' in receipt.createdAt) {
        const ts = receipt.createdAt as { _seconds: number };
        createdAt = new Date(ts._seconds * 1000);
      } else {
        createdAt = new Date();
      }

      if (receipt.type === 'charge') {
        spent30 += amount;
        if (createdAt >= oneDayAgo) {
          spentToday += amount;
        }
      }
      if (receipt.type === 'refund') {
        spent30 -= amount;
        if (createdAt >= oneDayAgo) {
          spentToday -= amount;
        }
      }
    });

    // Simple tier logic
    let tier = 'Member';
    let savingsPct = 0;
    if (spent30 >= 10000) { // $100+
      tier = 'Gold';
      savingsPct = 10;
    } else if (spent30 >= 5000) { // $50+
      tier = 'Silver';
      savingsPct = 5;
    }

    return {
      tier,
      savingsPct,
      spent30: spent30 / 100,
      spentToday: spentToday / 100,
    };
  } catch (error) {
    console.error('[firestore] getMemberStatus failed:', error);
    return { tier: 'Member', savingsPct: 0, spent30: 0, spentToday: 0 };
  }
}

// Initialize wallet with starting balance for new users
export async function ensureWalletInitialized(userId: string, initialBalanceCents = 10000): Promise<void> {
  try {
    const db = getDb();
    const snapshot = await db.collection('receipts')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // New user - give them initial balance
      await createReceipt({
        userId,
        type: 'topup',
        amountCents: initialBalanceCents,
        currency: 'USD',
        description: 'Welcome bonus',
      });
      console.log(`[firestore] Initialized wallet for ${userId} with $${initialBalanceCents / 100}`);
    }
  } catch (error) {
    console.error('[firestore] ensureWalletInitialized failed:', error);
  }
}
