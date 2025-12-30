'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCopyToClipboardOptions {
  resetDelay?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseCopyToClipboardReturn {
  isCopied: boolean;
  isError: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { resetDelay = 2000, onSuccess, onError } = options;

  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsCopied(false);
    setIsError(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Reset previous state
      reset();

      try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          textArea.style.top = '-9999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error('Fallback copy failed');
          }
        }

        setIsCopied(true);
        onSuccess?.(text);

        // Auto-reset after delay
        if (resetDelay > 0) {
          timeoutRef.current = setTimeout(() => {
            setIsCopied(false);
          }, resetDelay);
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Copy failed');
        setIsError(true);
        onError?.(error);

        // Auto-reset error after delay
        if (resetDelay > 0) {
          timeoutRef.current = setTimeout(() => {
            setIsError(false);
          }, resetDelay);
        }

        return false;
      }
    },
    [reset, resetDelay, onSuccess, onError]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isCopied, isError, copy, reset };
}

// Simple one-liner version
export function useCopy(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}
