import { EngineCaps, EngineInputField, Mode } from '@/types/engines';
import { getEngineCaps, type EngineCaps as EngineCapabilityCaps } from '@/fixtures/engineCaps';
import type { VideoItem, VideoGroup, ResultProvider } from '@/types/video-groups';

export function resolveRenderThumb(render: { thumbUrl?: string | null; aspectRatio?: string | null }): string {
  if (render.thumbUrl) return render.thumbUrl;
  switch (render.aspectRatio) {
    case '9:16':
      return '/assets/frames/thumb-9x16.svg';
    case '1:1':
      return '/assets/frames/thumb-1x1.svg';
    default:
      return '/assets/frames/thumb-16x9.svg';
  }
}

export type SharedVideoPayload = {
  id: string;
  engineId: string;
  engineLabel: string;
  durationSec: number;
  prompt: string;
  promptExcerpt?: string;
  thumbUrl?: string;
  videoUrl?: string;
  aspectRatio?: string;
  createdAt: string;
};

export function toVideoAspect(value?: string | null): VideoItem['aspect'] {
  switch (value) {
    case '9:16':
      return '9:16';
    case '1:1':
      return '1:1';
    default:
      return '16:9';
  }
}

export function mapSharedVideoToGroup(video: SharedVideoPayload, provider: ResultProvider): VideoGroup {
  const aspect = toVideoAspect(video.aspectRatio);
  const url = video.videoUrl ?? video.thumbUrl ?? '';
  const item: VideoItem = {
    id: video.id,
    url,
    aspect,
    thumb: video.thumbUrl ?? undefined,
    jobId: video.id,
    durationSec: video.durationSec,
    engineId: video.engineId,
    meta: {
      mediaType: video.videoUrl ? 'video' : 'image',
      prompt: video.prompt,
      engineLabel: video.engineLabel,
    },
  };

  return {
    id: `shared-${video.id}`,
    items: [item],
    layout: 'x1',
    createdAt: video.createdAt,
    provider,
    status: 'ready',
    heroItemId: item.id,
    meta: {
      source: 'gallery',
    },
  };
}

export function normalizeEngineToken(value?: string | null): string {
  if (typeof value !== 'string' || value.length === 0) return '';
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function matchesEngineToken(engine: EngineCaps, token: string): boolean {
  if (!token) return false;
  if (normalizeEngineToken(engine.id) === token) return true;
  if (normalizeEngineToken(engine.label) === token) return true;
  const slug = normalizeEngineToken(engine.providerMeta?.modelSlug);
  if (slug && slug === token) return true;
  return false;
}

export const MODE_DISPLAY_LABEL: Record<Mode, string> = {
  t2v: 'Text → Video',
  i2v: 'Image → Video',
  r2v: 'Reference → Video',
  t2i: 'Text → Image',
  i2i: 'Image → Image',
};

export type DurationOptionMeta = {
  raw: number | string;
  value: number;
  label: string;
};

export function parseDurationOptionValue(option: number | string): DurationOptionMeta {
  if (typeof option === 'number') {
    return {
      raw: option,
      value: option,
      label: `${option}s`,
    };
  }
  const numeric = Number(option.replace(/[^\d.]/g, ''));
  return {
    raw: option,
    value: Number.isFinite(numeric) ? numeric : 0,
    label: option,
  };
}

export function matchesDurationOption(meta: DurationOptionMeta, previousOption: number | string | null | undefined, previousSeconds: number | null | undefined): boolean {
  if (previousOption != null) {
    if (typeof previousOption === 'number') {
      return Math.abs(meta.value - previousOption) < 0.001;
    }
    if (typeof previousOption === 'string') {
      if (previousOption === meta.raw || previousOption === meta.label) return true;
      const previousNumeric = Number(previousOption.replace(/[^\d.]/g, ''));
      if (Number.isFinite(previousNumeric)) {
        return Math.abs(meta.value - previousNumeric) < 0.001;
      }
    }
  }
  if (previousSeconds != null) {
    return Math.abs(meta.value - previousSeconds) < 0.001;
  }
  return false;
}

export function normalizeFieldId(value: string | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseBooleanInput(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value !== 0;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(trimmed)) return true;
    if (['false', '0', 'no', 'off'].includes(trimmed)) return false;
  }
  return null;
}

export function findGenerateAudioField(engine: EngineCaps, mode: Mode): EngineInputField | null {
  const schema = engine.inputSchema;
  if (!schema) return null;
  const fields = [...(schema.required ?? []), ...(schema.optional ?? [])];
  return (
    fields.find((field) => {
      const id = normalizeFieldId(field.id);
      if (id !== 'generateaudio') return false;
      return !field.modes || field.modes.includes(mode);
    }) ?? null
  );
}

export function resolveAudioDefault(engine: EngineCaps, mode: Mode): boolean {
  const field = findGenerateAudioField(engine, mode);
  const parsed = parseBooleanInput(field?.default);
  return parsed ?? true;
}

export function framesToSeconds(frames: number): number {
  if (!Number.isFinite(frames) || frames <= 0) return 1;
  return Math.max(1, Math.round(frames / 24));
}

// Shape for state used in coerce
export type FormState = {
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
};

export function coerceFormState(engine: EngineCaps, mode: Mode, previous: FormState | null | undefined): FormState {
  const capability = getEngineCaps(engine.id, mode) as EngineCapabilityCaps | undefined;
  const isLumaRay2Engine = engine.id === 'lumaRay2';

  const durationResult = (() => {
    const prevOption = previous?.durationOption ?? null;
    const prevSeconds = previous?.durationSec ?? null;
    const prevFrames = previous?.numFrames ?? null;
    if (capability?.frames && capability.frames.length) {
      const framesList = capability.frames;
      let selectedFrames = prevFrames && framesList.includes(prevFrames) ? prevFrames : null;
      if (selectedFrames === null && prevSeconds != null) {
        const targetSeconds = Math.max(1, Math.round(prevSeconds));
        selectedFrames = framesList.reduce((best, candidate) => {
          const bestSeconds = framesToSeconds(best);
          const candidateSeconds = framesToSeconds(candidate);
          const bestDiff = Math.abs(bestSeconds - targetSeconds);
          const candidateDiff = Math.abs(candidateSeconds - targetSeconds);
          return candidateDiff < bestDiff ? candidate : best;
        }, framesList[0]);
      }
      if (selectedFrames === null) {
        selectedFrames = framesList[0];
      }
      const durationSec = framesToSeconds(selectedFrames);
      return {
        durationSec,
        durationOption: selectedFrames,
        numFrames: selectedFrames,
      };
    }
    if (capability?.duration) {
      if ('options' in capability.duration) {
        const parsedOptions = capability.duration.options.map(parseDurationOptionValue).filter((entry) => entry.value > 0);
        const defaultRaw = capability.duration.default ?? parsedOptions[0]?.raw ?? engine.maxDurationSec;
        const defaultMeta = parseDurationOptionValue(defaultRaw as number | string);
        const closestBySeconds =
          prevSeconds != null
            ? parsedOptions.reduce((best, candidate) => {
                const bestDiff = Math.abs(best.value - prevSeconds);
                const candidateDiff = Math.abs(candidate.value - prevSeconds);
                return candidateDiff < bestDiff ? candidate : best;
              }, parsedOptions[0])
            : null;
        const selected = parsedOptions.find((meta) => matchesDurationOption(meta, prevOption, prevSeconds))
          ?? closestBySeconds
          ?? parsedOptions.find((meta) => matchesDurationOption(meta, defaultRaw as number | string, defaultMeta.value))
          ?? parsedOptions[0]
          ?? defaultMeta;
        const clampedSeconds = Math.max(1, Math.min(engine.maxDurationSec, Math.round(selected.value)));
        return {
          durationSec: clampedSeconds,
          durationOption: selected.raw,
          numFrames: null,
        };
      }
      const min = capability.duration.min;
      const defaultValue = typeof capability.duration.default === 'number' ? capability.duration.default : min;
      const candidate = prevSeconds != null ? Math.max(min, prevSeconds) : defaultValue;
      const clampedSeconds = Math.max(min, Math.min(engine.maxDurationSec, Math.round(candidate)));
      return {
        durationSec: clampedSeconds,
        durationOption: clampedSeconds,
        numFrames: null,
      };
    }
    const fallback = prevSeconds != null ? prevSeconds : Math.min(engine.maxDurationSec, 8);
    return {
      durationSec: Math.max(1, Math.round(fallback)),
      durationOption: fallback,
      numFrames: null,
    };
  })();

  const resolutionOptions = capability?.resolution && capability.resolution.length ? capability.resolution : engine.resolutions;
  const aspectOptions = capability
    ? capability.aspectRatio && capability.aspectRatio.length
      ? capability.aspectRatio
      : []
    : engine.aspectRatios;

  const resolution = (() => {
    if (resolutionOptions.length === 0) {
      return previous?.resolution ?? engine.resolutions[0] ?? '1080p';
    }
    const previousResolution = previous?.resolution;
    if (previousResolution && resolutionOptions.includes(previousResolution)) {
      return previousResolution;
    }
    return resolutionOptions[0];
  })();

  const aspectRatio = (() => {
    if (aspectOptions.length === 0) {
      return previous?.aspectRatio ?? 'source';
    }
    const previousAspect = previous?.aspectRatio;
    if (previousAspect && aspectOptions.includes(previousAspect)) {
      return previousAspect;
    }
    return aspectOptions[0];
  })();

  const fpsOptions = engine.fps && engine.fps.length ? engine.fps : [24];
  const fps = (() => {
    if (previous?.fps && fpsOptions.includes(previous.fps)) {
      return previous.fps;
    }
    return fpsOptions[0];
  })();

  const iterations = previous?.iterations ? Math.max(1, Math.min(4, previous.iterations)) : 1;
  const loop = isLumaRay2Engine ? Boolean(previous?.loop) : undefined;
  const audio = (() => {
    const previousAudio = typeof previous?.audio === 'boolean' ? previous.audio : null;
    if (previousAudio !== null) return previousAudio;
    return resolveAudioDefault(engine, mode);
  })();

  return {
    engineId: engine.id,
    mode,
    durationSec: durationResult.durationSec,
    durationOption: durationResult.durationOption,
    numFrames: durationResult.numFrames ?? null,
    resolution,
    aspectRatio,
    fps,
    iterations,
    seedLocked: Boolean(previous?.seedLocked),
    loop,
    audio,
  };
}
