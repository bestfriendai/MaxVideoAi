import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
const cors = require("cors")({ origin: true });

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

export const engines = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    try {
      const snapshot = await db.collection("engines").get();
      const enginesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.status(200).json({ engines: enginesList });
    } catch (error) {
      console.error("Error loading engines:", error);
      res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR" } });
    }
  });
});

export const preflight = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    try {
      const body = req.body;
      const engineId = body.engineId || body.engine;

      if (!engineId) {
        res.status(400).json({ ok: false, error: { code: "MISSING_ENGINE" } });
        return;
      }

      const engineDoc = await db.collection("engines").doc(engineId).get();
      const engine: any = engineDoc.data();

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
      const rate = engine.pricing?.base || 0.05;
      const durationSec = body.durationSec || 5;
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
          maxDurationSec: engine.maxDurationSec || 60,
          supportedFps: engine.fps || [24, 30],
        },
        ttlSec: 120,
      });
    } catch (error) {
      console.error("Error in preflight:", error);
      res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR" } });
    }
  });
});

export const generate = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    try {
      const body = req.body;
      const userId = body.userId || "anonymous";
      const engineId = body.engineId || body.engine;

      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const jobData = {
        jobId,
        userId,
        engineId,
        status: "pending",
        prompt: body.prompt || "",
        aspectRatio: body.aspectRatio || "16:9",
        durationSec: body.durationSec || 5,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentStatus: "pending_payment",
        thumbUrl: "/assets/frames/thumb-16x9.svg",
        videoUrl: null,
      };

      await db.collection("jobs").doc(jobId).set(jobData);

      const rate = 0.05; // Default rate
      const totalCents = Math.round(rate * (body.durationSec || 5) * 100);

      res.status(200).json({
        ok: true,
        ...jobData,
        pricing: {
          currency: "USD",
          totalCents: totalCents,
          subtotalBeforeDiscountCents: totalCents,
          base: {
            seconds: body.durationSec || 5,
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
    } catch (error) {
      console.error("Error in generate:", error);
      res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR" } });
    }
  });
});

export const jobs = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "GET") {
      res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });
      return;
    }

    try {
      const limitCount = parseInt(req.query.limit as string) || 24;
      const cursor = req.query.cursor as string;

      let query: admin.firestore.Query = db.collection("jobs")
        .orderBy("createdAt", "desc")
        .limit(limitCount);

      if (cursor) {
        const cursorDoc = await db.collection("jobs").doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      const nextCursor = lastDoc ? lastDoc.id : null;

      res.status(200).json({
        ok: true,
        jobs: jobsList,
        nextCursor,
      });
    } catch (error) {
      console.error("Error loading jobs:", error);
      res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR" } });
    }
  });
});

export const seed = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const enginesData = require("../engines.json");
      const jobsData = require("../jobs.json");

      const batch = db.batch();

      // Seed Engines
      enginesData.engines.forEach((engine: any) => {
        const docRef = db.collection("engines").doc(engine.id);
        batch.set(docRef, {
          ...engine,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // Seed Jobs
      jobsData.jobs.forEach((job: any) => {
        const docRef = db.collection("jobs").doc(job.jobId);
        batch.set(docRef, {
          ...job,
          createdAt: job.createdAt ? admin.firestore.Timestamp.fromDate(new Date(job.createdAt)) : admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();

      res.status(200).json({
        ok: true,
        message: `Seeded ${enginesData.engines.length} engines and ${jobsData.jobs.length} jobs.`
      });
    } catch (error) {
      console.error("Error seeding:", error);
      res.status(500).json({ ok: false, error: String(error) });
    }
  });
});

export const healthz = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  });
});