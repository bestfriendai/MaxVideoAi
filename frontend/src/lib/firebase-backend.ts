import { ENV } from './env';

export async function fetchFromFirebase(path: string, options: RequestInit = {}) {
    const baseUrl = ENV.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL is not set');
    }

    // Remove trailing flash from baseUrl if present, and leading slash from path
    const sanitizedBase = baseUrl.replace(/\/$/, '');
    const sanitizedPath = path.replace(/^\//, '');

    const url = `${sanitizedBase}/${sanitizedPath}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Error calling Firebase Function: ${response.statusText}`);
    }

    return response.json();
}
