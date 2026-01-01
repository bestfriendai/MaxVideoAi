import type { Mode } from '@/types/engines';

export interface WorkspaceFormState {
  engineId: string;
  mode: Mode;
  durationSec: number;
  durationOption?: number | string | null;
  numFrames?: number | null;
  resolution: string;
  aspectRatio: string;
  fps: number;
  iterations: number;
  seedLocked?: boolean;
  loop?: boolean;
  audio: boolean;
}
