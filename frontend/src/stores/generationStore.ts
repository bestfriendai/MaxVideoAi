'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export type GenerationStatus =
  | 'idle'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type Engine =
  | 'kling'
  | 'runway'
  | 'luma'
  | 'minimax'
  | 'pika'
  | 'haiper'
  | 'vidu'
  | 'pixverse';

export interface GenerationSettings {
  engine: Engine;
  prompt: string;
  negativePrompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  duration: number;
  fps: number;
  motion: number;
  cfgScale: number;
  seed: number | null;
  mode: 'text-to-video' | 'image-to-video' | 'video-to-video';
}

export interface GenerationJob {
  id: string;
  status: GenerationStatus;
  progress: number;
  settings: GenerationSettings;
  inputImage: string | null;
  inputVideo: string | null;
  outputUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  estimatedTime: number | null;
}

interface GenerationState {
  // Current generation settings
  settings: GenerationSettings;
  inputImage: File | string | null;
  inputVideo: File | string | null;

  // Active jobs
  jobs: GenerationJob[];
  activeJobId: string | null;

  // UI state
  isGenerating: boolean;
  previewUrl: string | null;

  // History
  history: GenerationJob[];
  historyPage: number;
  hasMoreHistory: boolean;

  // Actions - Settings
  setEngine: (engine: Engine) => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;
  setAspectRatio: (aspectRatio: GenerationSettings['aspectRatio']) => void;
  setDuration: (duration: number) => void;
  setFps: (fps: number) => void;
  setMotion: (motion: number) => void;
  setCfgScale: (cfgScale: number) => void;
  setSeed: (seed: number | null) => void;
  setMode: (mode: GenerationSettings['mode']) => void;
  updateSettings: (settings: Partial<GenerationSettings>) => void;
  resetSettings: () => void;

  // Actions - Input
  setInputImage: (image: File | string | null) => void;
  setInputVideo: (video: File | string | null) => void;
  setPreviewUrl: (url: string | null) => void;
  clearInputs: () => void;

  // Actions - Jobs
  addJob: (job: GenerationJob) => void;
  updateJob: (id: string, updates: Partial<GenerationJob>) => void;
  removeJob: (id: string) => void;
  setActiveJob: (id: string | null) => void;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;

  // Actions - History
  setHistory: (jobs: GenerationJob[]) => void;
  appendHistory: (jobs: GenerationJob[]) => void;
  clearHistory: () => void;
  loadMoreHistory: () => void;

  // Computed
  getActiveJob: () => GenerationJob | undefined;
  getJobById: (id: string) => GenerationJob | undefined;
  getPendingJobs: () => GenerationJob[];
  getCompletedJobs: () => GenerationJob[];
}

const defaultSettings: GenerationSettings = {
  engine: 'kling',
  prompt: '',
  negativePrompt: '',
  aspectRatio: '16:9',
  duration: 5,
  fps: 24,
  motion: 50,
  cfgScale: 7,
  seed: null,
  mode: 'text-to-video',
};

export const useGenerationStore = create<GenerationState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      settings: defaultSettings,
      inputImage: null,
      inputVideo: null,
      jobs: [],
      activeJobId: null,
      isGenerating: false,
      previewUrl: null,
      history: [],
      historyPage: 1,
      hasMoreHistory: true,

      // Settings actions
      setEngine: (engine) => {
        set((state) => ({
          settings: { ...state.settings, engine },
        }));
      },

      setPrompt: (prompt) => {
        set((state) => ({
          settings: { ...state.settings, prompt },
        }));
      },

      setNegativePrompt: (negativePrompt) => {
        set((state) => ({
          settings: { ...state.settings, negativePrompt },
        }));
      },

      setAspectRatio: (aspectRatio) => {
        set((state) => ({
          settings: { ...state.settings, aspectRatio },
        }));
      },

      setDuration: (duration) => {
        set((state) => ({
          settings: { ...state.settings, duration },
        }));
      },

      setFps: (fps) => {
        set((state) => ({
          settings: { ...state.settings, fps },
        }));
      },

      setMotion: (motion) => {
        set((state) => ({
          settings: { ...state.settings, motion },
        }));
      },

      setCfgScale: (cfgScale) => {
        set((state) => ({
          settings: { ...state.settings, cfgScale },
        }));
      },

      setSeed: (seed) => {
        set((state) => ({
          settings: { ...state.settings, seed },
        }));
      },

      setMode: (mode) => {
        set((state) => ({
          settings: { ...state.settings, mode },
        }));
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      // Input actions
      setInputImage: (image) => {
        set({ inputImage: image });
      },

      setInputVideo: (video) => {
        set({ inputVideo: video });
      },

      setPreviewUrl: (url) => {
        set({ previewUrl: url });
      },

      clearInputs: () => {
        set({
          inputImage: null,
          inputVideo: null,
          previewUrl: null,
        });
      },

      // Job actions
      addJob: (job) => {
        set((state) => ({
          jobs: [job, ...state.jobs],
          activeJobId: job.id,
          isGenerating: true,
        }));
      },

      updateJob: (id, updates) => {
        set((state) => {
          const jobs = state.jobs.map((job) =>
            job.id === id
              ? { ...job, ...updates, updatedAt: new Date().toISOString() }
              : job
          );

          // Check if still generating
          const isGenerating = jobs.some(
            (job) => job.status === 'pending' || job.status === 'processing'
          );

          return { jobs, isGenerating };
        });
      },

      removeJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          activeJobId: state.activeJobId === id ? null : state.activeJobId,
        }));
      },

      setActiveJob: (id) => {
        set({ activeJobId: id });
      },

      cancelJob: (id) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? { ...job, status: 'cancelled' as GenerationStatus }
              : job
          ),
        }));
      },

      retryJob: (id) => {
        const job = get().getJobById(id);
        if (job) {
          set((state) => ({
            settings: job.settings,
            inputImage: job.inputImage,
            inputVideo: job.inputVideo,
          }));
        }
      },

      // History actions
      setHistory: (jobs) => {
        set({ history: jobs, historyPage: 1 });
      },

      appendHistory: (jobs) => {
        set((state) => ({
          history: [...state.history, ...jobs],
          historyPage: state.historyPage + 1,
          hasMoreHistory: jobs.length > 0,
        }));
      },

      clearHistory: () => {
        set({ history: [], historyPage: 1, hasMoreHistory: true });
      },

      loadMoreHistory: () => {
        // This would typically trigger an API call
        // For now, just increment the page
        set((state) => ({
          historyPage: state.historyPage + 1,
        }));
      },

      // Computed getters
      getActiveJob: () => {
        const state = get();
        return state.jobs.find((job) => job.id === state.activeJobId);
      },

      getJobById: (id) => {
        return get().jobs.find((job) => job.id === id);
      },

      getPendingJobs: () => {
        return get().jobs.filter(
          (job) => job.status === 'pending' || job.status === 'processing'
        );
      },

      getCompletedJobs: () => {
        return get().jobs.filter((job) => job.status === 'completed');
      },
    })),
    { name: 'generation-store' }
  )
);

// Subscribe to job status changes for notifications
useGenerationStore.subscribe(
  (state) => state.jobs,
  (jobs, previousJobs) => {
    // Check for newly completed jobs
    jobs.forEach((job) => {
      const prevJob = previousJobs.find((j) => j.id === job.id);
      if (prevJob && prevJob.status !== 'completed' && job.status === 'completed') {
        // Could trigger a toast notification here
        console.log(`Job ${job.id} completed!`);
      }
    });
  }
);
