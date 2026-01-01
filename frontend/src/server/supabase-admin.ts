import { getUserById, isFirebaseAdminConfigured, getFirebaseAuth } from './firebase-admin';

// Firebase Admin SDK - Replaces Supabase Admin
// This module provides admin-level user management via Firebase

export function isConfigured(): boolean {
  return isFirebaseAdminConfigured();
}

/**
 * Get a Firebase Admin client (for backward compatibility)
 * @deprecated Use Firebase Admin SDK functions directly
 */
export function getSupabaseAdmin() {
  console.warn('[DEPRECATED] getSupabaseAdmin is deprecated. Use Firebase Admin SDK directly.');

  return {
    auth: {
      admin: {
        getUserById: async (userId: string) => {
          if (!isConfigured()) {
            return { data: { user: null }, error: { message: 'Firebase Admin not configured' } };
          }
          try {
            const auth = getFirebaseAuth();
            const user = await auth.getUser(userId);
            return {
              data: {
                user: {
                  id: user.uid,
                  email: user.email,
                  phone: user.phoneNumber,
                  created_at: user.metadata.creationTime,
                  last_sign_in_at: user.metadata.lastSignInTime,
                  email_confirmed_at: user.emailVerified ? user.metadata.creationTime : null,
                  user_metadata: user.customClaims ?? {},
                  app_metadata: {},
                  factors: user.multiFactor?.enrolledFactors ?? [],
                  identities: [],
                  role: user.customClaims?.role ?? null,
                  banned_until: user.disabled ? 'indefinite' : null,
                },
              },
              error: null,
            };
          } catch (error) {
            return {
              data: { user: null },
              error: { message: error instanceof Error ? error.message : 'Unknown error' },
            };
          }
        },
        listUsers: async ({ perPage = 100 }: { page?: number; perPage?: number } = {}) => {
          if (!isConfigured()) {
            return { data: { users: [] }, error: { message: 'Firebase Admin not configured' } };
          }
          try {
            const auth = getFirebaseAuth();
            const result = await auth.listUsers(perPage);
            return {
              data: {
                users: result.users.map(user => ({
                  id: user.uid,
                  email: user.email,
                  phone: user.phoneNumber,
                  created_at: user.metadata.creationTime,
                  last_sign_in_at: user.metadata.lastSignInTime,
                  email_confirmed_at: user.emailVerified ? user.metadata.creationTime : null,
                  user_metadata: user.customClaims ?? {},
                  app_metadata: {},
                })),
              },
              error: null,
            };
          } catch (error) {
            return {
              data: { users: [] },
              error: { message: error instanceof Error ? error.message : 'Unknown error' },
            };
          }
        },
        updateUserById: async (userId: string, attrs: Record<string, unknown>) => {
          if (!isConfigured()) {
            return { data: { user: null }, error: { message: 'Firebase Admin not configured' } };
          }
          try {
            const auth = getFirebaseAuth();
            const updateData: Parameters<typeof auth.updateUser>[1] = {};
            if (attrs.email) updateData.email = String(attrs.email);
            if (attrs.phone) updateData.phoneNumber = String(attrs.phone);
            if (attrs.password) updateData.password = String(attrs.password);
            if (typeof attrs.disabled === 'boolean') updateData.disabled = attrs.disabled;

            const user = await auth.updateUser(userId, updateData);
            return {
              data: {
                user: {
                  id: user.uid,
                  email: user.email,
                },
              },
              error: null,
            };
          } catch (error) {
            return {
              data: { user: null },
              error: { message: error instanceof Error ? error.message : 'Unknown error' },
            };
          }
        },
        deleteUser: async (userId: string) => {
          if (!isConfigured()) {
            return { data: null, error: { message: 'Firebase Admin not configured' } };
          }
          try {
            const auth = getFirebaseAuth();
            await auth.deleteUser(userId);
            return { data: null, error: null };
          } catch (error) {
            return {
              data: null,
              error: { message: error instanceof Error ? error.message : 'Unknown error' },
            };
          }
        },
      },
    },
  };
}

/**
 * Get user identity by ID
 */
export async function getUserIdentity(userId: string): Promise<{ id: string; email: string | null; fullName: string | null } | null> {
  if (!isConfigured()) return null;

  try {
    const user = await getUserById(userId);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.displayName,
      };
    }
  } catch (error) {
    console.warn('[firebase-admin] getUserIdentity failed:', error instanceof Error ? error.message : error);
  }

  return null;
}
