'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

export interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  });

  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);

  // Keep the function reference up to date
  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
        isIdle: false,
      });

      try {
        const result = await asyncFnRef.current(...args);

        if (mountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
            isIdle: false,
          });
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setState({
            data: null,
            error,
            isLoading: false,
            isSuccess: false,
            isError: true,
            isIdle: false,
          });
          onError?.(error);
        }

        return null;
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
    });
  }, []);

  // Execute immediately if option is set
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, [immediate, execute]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Simpler version for fetch calls
export function useAsyncFetch<T>(
  url: string,
  options?: RequestInit & UseAsyncOptions
) {
  const { immediate = true, onSuccess, onError, ...fetchOptions } = options || {};

  return useAsync<T>(
    async () => {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      return response.json();
    },
    { immediate, onSuccess, onError }
  );
}
