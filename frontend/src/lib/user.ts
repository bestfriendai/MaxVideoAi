import type { NextRequest } from 'next/server';
import { getRouteAuthContext } from '@/lib/supabase-ssr';

export async function getUserIdFromRequest(req?: NextRequest): Promise<string | null> {
  if (!req) return null;
  try {
    const { userId } = await getRouteAuthContext(req);
    return userId;
  } catch {
    return null;
  }
}
