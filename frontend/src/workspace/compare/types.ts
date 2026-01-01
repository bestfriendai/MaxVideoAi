export type CompareEntry = {
  jobId: string;
  engineId: string;
  engineLabel: string;
  prompt: string;
  negativePrompt?: string;
  durationSec: number;
  aspectRatio: string;
  resolution: string;
  thumbUrl: string | null;
  videoUrl: string | null;
  createdAt?: string;
  priceCents?: number;
  currency?: string;
  localKey?: string;
};

export type CompareState = {
  entries: CompareEntry[];
  maxEntries: number;
};

export type CompareAction =
  | { type: 'add'; entry: CompareEntry }
  | { type: 'remove'; jobId: string }
  | { type: 'clear' }
  | { type: 'set'; entries: CompareEntry[] };

export function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case 'add': {
      if (state.entries.some((e) => e.jobId === action.entry.jobId)) {
        return state;
      }
      const entries = [...state.entries, action.entry].slice(-state.maxEntries);
      return { ...state, entries };
    }
    case 'remove': {
      const entries = state.entries.filter((e) => e.jobId !== action.jobId);
      return { ...state, entries };
    }
    case 'clear':
      return { ...state, entries: [] };
    case 'set':
      return { ...state, entries: action.entries.slice(0, state.maxEntries) };
    default:
      return state;
  }
}

export function createInitialCompareState(maxEntries = 4): CompareState {
  return {
    entries: [],
    maxEntries,
  };
}
