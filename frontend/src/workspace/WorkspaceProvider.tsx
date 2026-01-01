'use client';

import React, { createContext, useContext, useMemo, useReducer, useCallback } from 'react';
import type { Mode } from '@/types/engines';

export type WorkspaceState = {
  engineId: string;
  mode: Mode;
  prompt: string;
  negativePrompt: string;
  durationSec: number;
  aspectRatio: string;
  resolution: string;
  audio: boolean;
};

export type WorkspaceAction =
  | { type: 'setPrompt'; value: string }
  | { type: 'setNegativePrompt'; value: string }
  | { type: 'setEngine'; value: string }
  | { type: 'setMode'; value: Mode }
  | { type: 'setDuration'; value: number }
  | { type: 'setAspectRatio'; value: string }
  | { type: 'setResolution'; value: string }
  | { type: 'setAudio'; value: boolean }
  | { type: 'restore'; value: Partial<WorkspaceState> };

export type WorkspaceContextValue = {
  state: WorkspaceState;
  dispatch: React.Dispatch<WorkspaceAction>;
  setPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  setEngine: (value: string) => void;
  setMode: (value: Mode) => void;
  setDuration: (value: number) => void;
  setAspectRatio: (value: string) => void;
  setResolution: (value: string) => void;
  setAudio: (value: boolean) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const initialState: WorkspaceState = {
  engineId: 'veo-3-1',
  mode: 't2v',
  prompt: '',
  negativePrompt: '',
  durationSec: 4,
  aspectRatio: '16:9',
  resolution: '1080p',
  audio: true,
};

function reducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'setPrompt':
      return { ...state, prompt: action.value };
    case 'setNegativePrompt':
      return { ...state, negativePrompt: action.value };
    case 'setEngine':
      return { ...state, engineId: action.value };
    case 'setMode':
      return { ...state, mode: action.value };
    case 'setDuration':
      return { ...state, durationSec: action.value };
    case 'setAspectRatio':
      return { ...state, aspectRatio: action.value };
    case 'setResolution':
      return { ...state, resolution: action.value };
    case 'setAudio':
      return { ...state, audio: action.value };
    case 'restore':
      return { ...state, ...action.value };
    default:
      return state;
  }
}

export type WorkspaceProviderProps = {
  children: React.ReactNode;
  initialEngineId?: string;
  initialMode?: Mode;
};

export function WorkspaceProvider({ children, initialEngineId, initialMode }: WorkspaceProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    engineId: initialEngineId ?? initialState.engineId,
    mode: initialMode ?? initialState.mode,
  });

  const setPrompt = useCallback((value: string) => dispatch({ type: 'setPrompt', value }), []);
  const setNegativePrompt = useCallback((value: string) => dispatch({ type: 'setNegativePrompt', value }), []);
  const setEngine = useCallback((value: string) => dispatch({ type: 'setEngine', value }), []);
  const setMode = useCallback((value: Mode) => dispatch({ type: 'setMode', value }), []);
  const setDuration = useCallback((value: number) => dispatch({ type: 'setDuration', value }), []);
  const setAspectRatio = useCallback((value: string) => dispatch({ type: 'setAspectRatio', value }), []);
  const setResolution = useCallback((value: string) => dispatch({ type: 'setResolution', value }), []);
  const setAudio = useCallback((value: boolean) => dispatch({ type: 'setAudio', value }), []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      dispatch,
      setPrompt,
      setNegativePrompt,
      setEngine,
      setMode,
      setDuration,
      setAspectRatio,
      setResolution,
      setAudio,
    }),
    [state, setPrompt, setNegativePrompt, setEngine, setMode, setDuration, setAspectRatio, setResolution, setAudio]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return ctx;
}

export function useWorkspaceOptional(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}
