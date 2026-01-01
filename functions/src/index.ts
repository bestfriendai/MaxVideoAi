import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({ origin: true });

// Helper to verify Firebase Auth token from Authorization header
async function verifyAuthToken(req: functions.https.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// Helper wrapper for CORS handling
function withCors(
  handler: (req: functions.https.Request, res: functions.Response) => Promise<void>
) {
  return (req: functions.https.Request, res: functions.Response) => {
    corsHandler(req, res, async () => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error("Unhandled error:", error);
        res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR" } });
      }
    });
  };
}

export const engines = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    const snapshot = await db.collection("engines").get();
    const enginesList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ engines: enginesList });
  })
);

export const preflight = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const engineId = (body.engineId || body.engine) as string | undefined;

    if (!engineId) {
      res.status(400).json({ ok: false, error: { code: "MISSING_ENGINE" } });
      return;
    }

    const engineDoc = await db.collection("engines").doc(engineId).get();
    const engine = engineDoc.data() as Record<string, unknown> | undefined;

    if (!engine) {
      res.status(404).json({
        ok: false,
        error: {
          code: "UNKNOWN_ENGINE",
          message: `Engine ${engineId} is not available.`,
        },
      });
      return;
    }

    // Simple pricing logic for demo - in production this would be more complex
    const pricing = engine.pricing as Record<string, number> | undefined;
    const rate = pricing?.base || 0.05;
    const durationSec = (body.durationSec as number) || 5;
    const total = rate * durationSec;

    res.status(200).json({
      ok: true,
      currency: "USD",
      itemization: {
        base: {
          unit: "USD/s",
          rate: rate,
          seconds: durationSec,
          subtotal: total,
        },
        addons: [],
        discounts: [],
        taxes: [],
      },
      total: total,
      caps: {
        maxDurationSec: (engine.maxDurationSec as number) || 60,
        supportedFps: (engine.fps as number[]) || [24, 30],
      },
      ttlSec: 120,
    });
  })
);

export const generate = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    // Verify authentication
    const userId = await verifyAuthToken(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: { code: "UNAUTHORIZED" } });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const engineId = (body.engineId || body.engine) as string | undefined;

    if (!engineId) {
      res.status(400).json({ ok: false, error: { code: "MISSING_ENGINE" } });
      return;
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const durationSec = (body.durationSec as number) || 5;

    const jobData = {
      jobId,
      userId,
      engineId,
      status: "pending",
      prompt: (body.prompt as string) || "",
      aspectRatio: (body.aspectRatio as string) || "16:9",
      durationSec,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentStatus: "pending_payment",
      thumbUrl: "/assets/frames/thumb-16x9.svg",
      videoUrl: null,
    };

    await db.collection("jobs").doc(jobId).set(jobData);

    const rate = 0.05; // Default rate
    const totalCents = Math.round(rate * durationSec * 100);

    res.status(200).json({
      ok: true,
      ...jobData,
      pricing: {
        currency: "USD",
        totalCents: totalCents,
        subtotalBeforeDiscountCents: totalCents,
        base: {
          seconds: durationSec,
          rate: rate,
          unit: "USD/s",
          amountCents: totalCents,
        },
        addons: [],
        margin: {
          amountCents: 0,
        },
      },
    });
  })
);

export const jobs = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    // Verify authentication
    const userId = await verifyAuthToken(req);
    if (!userId) {
      res.status(401).json({ ok: false, error: { code: "UNAUTHORIZED" } });
      return;
    }

    const limitCount = parseInt(req.query.limit as string) || 24;
    const cursor = req.query.cursor as string | undefined;

    let query: admin.firestore.Query = db
      .collection("jobs")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limitCount);

    if (cursor) {
      const cursorDoc = await db.collection("jobs").doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const jobsList = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string
      const createdAt = data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
      return {
        ...data,
        id: doc.id,
        createdAt,
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? lastDoc.id : null;

    res.status(200).json({
      ok: true,
      jobs: jobsList,
      nextCursor,
    });
  })
);

export const seed = functions.https.onRequest(
  withCors(async (req, res) => {
    // Only allow in development/emulator
    if (process.env.FUNCTIONS_EMULATOR !== "true") {
      res.status(403).json({ ok: false, error: "Seed only available in emulator" });
      return;
    }

    // Dynamic import for JSON files
    const enginesData = await import("../engines.json");
    const jobsData = await import("../jobs.json");

    const batch = db.batch();

    // Seed Engines
    const engines = enginesData.engines as Array<{ id: string; [key: string]: unknown }>;
    engines.forEach((engine) => {
      const docRef = db.collection("engines").doc(engine.id);
      batch.set(docRef, {
        ...engine,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Seed Jobs
    const jobsArray = jobsData.jobs as Array<{ jobId: string; createdAt?: string; [key: string]: unknown }>;
    jobsArray.forEach((job) => {
      const docRef = db.collection("jobs").doc(job.jobId);
      batch.set(docRef, {
        ...job,
        createdAt: job.createdAt
          ? admin.firestore.Timestamp.fromDate(new Date(job.createdAt))
          : admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    res.status(200).json({
      ok: true,
      message: `Seeded ${engines.length} engines and ${jobsArray.length} jobs.`,
    });
  })
);

export const healthz = functions.https.onRequest(
  withCors(async (_req, res) => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  })
);
