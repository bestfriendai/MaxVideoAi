import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

function getFirebaseConfig(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

export function isFirebaseAdminConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

export function getFirebaseAdmin(): App {
  if (app) return app;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  const config = getFirebaseConfig();
  if (!config) {
    throw new Error('Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
  }

  app = initializeApp({
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  });

  return app;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const adminApp = getFirebaseAdmin();
  authInstance = getAuth(adminApp);
  return authInstance;
}

export function getFirebaseFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  const adminApp = getFirebaseAdmin();
  firestoreInstance = getFirestore(adminApp);
  return firestoreInstance;
}

export async function verifyIdToken(token: string): Promise<{ uid: string; email?: string } | null> {
  if (!isFirebaseAdminConfigured()) {
    console.warn('[firebase-admin] Not configured, using REST API fallback');
    return verifyIdTokenViaRest(token);
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return { uid: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('[firebase-admin] Token verification failed:', error);
    return null;
  }
}

// Fallback verification using REST API when Admin SDK is not configured
async function verifyIdTokenViaRest(token: string): Promise<{ uid: string; email?: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    console.warn('[firebase-admin] No API key for REST verification');
    return null;
  }

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    const data = await res.json();
    if (data.users && data.users.length > 0) {
      return { uid: data.users[0].localId, email: data.users[0].email };
    }
    return null;
  } catch (error) {
    console.error('[firebase-admin] REST verification failed:', error);
    return null;
  }
}

export async function getUserById(uid: string): Promise<{ id: string; email: string | null; displayName: string | null } | null> {
  if (!isFirebaseAdminConfigured()) {
    console.warn('[firebase-admin] Not configured, cannot get user by ID');
    return null;
  }

  try {
    const auth = getFirebaseAuth();
    const user = await auth.getUser(uid);
    return {
      id: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
    };
  } catch (error) {
    console.error('[firebase-admin] getUserById failed:', error);
    return null;
  }
}
