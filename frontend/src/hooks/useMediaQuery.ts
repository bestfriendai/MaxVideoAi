'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if a media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Common breakpoint hooks
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

// Preference hooks
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersLightMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: light)');
}

// Device capability hooks
export function useHasHover(): boolean {
  return useMediaQuery('(hover: hover)');
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

// Responsive columns hook
export function useResponsiveColumns(options?: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
  largeDesktop?: number;
}): number {
  const { mobile = 1, tablet = 2, desktop = 3, largeDesktop = 4 } = options || {};

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeDesktop = useIsLargeDesktop();

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  if (isLargeDesktop) return largeDesktop;
  return desktop;
}
