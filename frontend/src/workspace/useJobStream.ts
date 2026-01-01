'use client';

import { useEffect, useRef, useState } from 'react';
import type { Job } from '@/types/jobs';

export type JobStreamPayload = {
  jobs: Job[];
};

export type JobStreamOptions = {
  enabled: boolean;
  limit?: number;
  onJobs: (jobs: Job[]) => void;
};

export function useJobStream({ enabled, limit = 20, onJobs }: JobStreamOptions) {
  const [connected, setConnected] = useState(false);
  const onJobsRef = useRef(onJobs);

  useEffect(() => {
    onJobsRef.current = onJobs;
  }, [onJobs]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const source = new EventSource(`/api/jobs/stream?limit=${limit}`);

    source.onopen = () => {
      setConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as JobStreamPayload | null;
        if (!payload?.jobs) return;
        onJobsRef.current(payload.jobs);
      } catch {
        // ignore malformed payloads
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [enabled, limit]);

  return { connected };
}
