'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAuthenticated: false,
    getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const initializedRef = useRef(false);

    useEffect(() => {
        // Prevent double initialization in development with strict mode
        if (initializedRef.current) return;
        initializedRef.current = true;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            initializedRef.current = false;
        };
    }, []);

    const getIdToken = async (): Promise<string | null> => {
        if (!user) return null;
        try {
            return await user.getIdToken();
        } catch (e) {
            console.error('[AuthProvider] Failed to get ID token:', e);
            return null;
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        getIdToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

// Loading component for protected routes
export function AuthLoading({ children }: { children?: ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-bg">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
                {children}
            </div>
        </div>
    );
}
