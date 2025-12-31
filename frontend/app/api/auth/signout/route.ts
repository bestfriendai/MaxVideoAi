import { NextResponse } from 'next/server';

// Firebase Auth: Sign out is handled client-side
// This endpoint just acknowledges the request
// The client uses firebase.auth().signOut() directly

export async function POST() {
  // Firebase signout is client-side only
  // Server just acknowledges the request
  return NextResponse.json({ ok: true });
}
