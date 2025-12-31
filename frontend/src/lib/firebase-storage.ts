import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseApp } from './firebase-client';
import { randomUUID } from 'crypto';

let storageInstance: ReturnType<typeof getStorage> | null = null;

function getFirebaseStorage() {
  if (!storageInstance) {
    const app = getFirebaseApp();
    storageInstance = getStorage(app);
  }
  return storageInstance;
}

export function isFirebaseStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
}

function inferExtension(mime: string, fallback = 'bin'): string {
  const match = mime.match(/^[^/]+\/([^;]+)/);
  if (!match) return fallback;
  return match[1].toLowerCase();
}

function getPngDimensions(data: Buffer): { width: number; height: number } | null {
  if (data.length < 24) return null;
  if (data.readUInt32BE(12) !== 0x49484452) return null;
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  return { width, height };
}

function getJpegDimensions(data: Buffer): { width: number; height: number } | null {
  if (data.length < 4 || data.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < data.length) {
    const marker = data.readUInt16BE(offset);
    offset += 2;
    const length = data.readUInt16BE(offset);
    if (length < 2) return null;
    if (marker >= 0xffc0 && marker <= 0xffcf && marker !== 0xffc4 && marker !== 0xffc8 && marker !== 0xffcc) {
      if (offset + 5 >= data.length) return null;
      const height = data.readUInt16BE(offset + 3);
      const width = data.readUInt16BE(offset + 5);
      return { width, height };
    }
    offset += length;
  }
  return null;
}

function getImageDimensions(buffer: Buffer, mime: string): { width: number | null; height: number | null } {
  try {
    if (mime === 'image/png') {
      const dims = getPngDimensions(buffer);
      if (dims) return dims;
    } else if (mime === 'image/jpeg' || mime === 'image/jpg') {
      const dims = getJpegDimensions(buffer);
      if (dims) return dims;
    }
  } catch {
    // ignore parse errors
  }
  return { width: null, height: null };
}

export type UploadResult = {
  url: string;
  key: string;
  width: number | null;
  height: number | null;
  size: number;
  mime: string;
};

export async function uploadToFirebaseStorage(params: {
  data: Buffer;
  mime: string;
  userId?: string | null;
  fileName?: string | null;
  prefix?: string;
}): Promise<UploadResult> {
  const storage = getFirebaseStorage();
  const safeMime = params.mime && params.mime.startsWith('image/') ? params.mime : 'image/png';
  const extension = inferExtension(safeMime, 'png');
  const slug = randomUUID();
  const baseName = params.fileName?.replace(/\s+/g, '-')?.replace(/[^a-zA-Z0-9._-]/g, '') || `${slug}.${extension}`;
  const key = [params.prefix || 'uploads', params.userId ?? 'anonymous', `${slug}-${baseName}`]
    .filter(Boolean)
    .join('/');

  const storageRef = ref(storage, key);
  const uint8Array = new Uint8Array(params.data);

  await uploadBytes(storageRef, uint8Array, {
    contentType: safeMime,
    cacheControl: 'public, max-age=3600',
  });

  const url = await getDownloadURL(storageRef);
  const { width, height } = getImageDimensions(params.data, safeMime);

  return {
    url,
    key,
    width,
    height,
    size: params.data.length,
    mime: safeMime,
  };
}

export async function deleteFromFirebaseStorage(key: string): Promise<void> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, key);
  await deleteObject(storageRef);
}

// Server-side upload using Firebase Admin SDK
import { getFirebaseAdmin } from '@/server/firebase-admin';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';

let adminStorageInstance: ReturnType<typeof getAdminStorage> | null = null;

function getAdminStorageBucket() {
  if (!adminStorageInstance) {
    const app = getFirebaseAdmin();
    adminStorageInstance = getAdminStorage(app);
  }
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return adminStorageInstance.bucket(bucketName);
}

export async function uploadToFirebaseStorageServer(params: {
  data: Buffer;
  mime: string;
  userId?: string | null;
  fileName?: string | null;
  prefix?: string;
}): Promise<UploadResult> {
  const bucket = getAdminStorageBucket();
  const safeMime = params.mime && params.mime.startsWith('image/') ? params.mime : 'image/png';
  const extension = inferExtension(safeMime, 'png');
  const slug = randomUUID();
  const baseName = params.fileName?.replace(/\s+/g, '-')?.replace(/[^a-zA-Z0-9._-]/g, '') || `${slug}.${extension}`;
  const key = [params.prefix || 'uploads', params.userId ?? 'anonymous', `${slug}-${baseName}`]
    .filter(Boolean)
    .join('/');

  const file = bucket.file(key);
  await file.save(params.data, {
    contentType: safeMime,
    metadata: {
      cacheControl: 'public, max-age=3600',
    },
  });

  // Make the file publicly accessible
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${key}`;
  const { width, height } = getImageDimensions(params.data, safeMime);

  return {
    url: publicUrl,
    key,
    width,
    height,
    size: params.data.length,
    mime: safeMime,
  };
}

export async function deleteFromFirebaseStorageServer(key: string): Promise<void> {
  const bucket = getAdminStorageBucket();
  const file = bucket.file(key);
  await file.delete();
}
