'use client';

import React, { memo } from 'react';
import { EngineSelect } from '@/components/ui/EngineSelect';
import { SettingsControls } from '@/components/SettingsControls';
import type { EngineCaps, Mode } from '@/types/engines';
import type { EngineCaps as EngineCapabilityCaps } from '@/fixtures/engineCaps';
import { MODE_DISPLAY_LABEL } from '@/lib/workspace-helpers';
import type { WorkspaceFormState } from '@/workspace/types';

export type WorkspaceControlsPanelProps = {
  engines: EngineCaps[];
  form: WorkspaceFormState;
  selectedEngine: EngineCaps;
  capability?: EngineCapabilityCaps;
  engineModeOptions?: Mode[];
  supportsAudioToggle: boolean;
  cfgScale: number | null;
  onCfgScaleChange: (value: number | null) => void;
  onEngineChange: (engineId: string) => void;
  onModeChange: (mode: Mode) => void;
  onDurationChange: (value: number | string) => void;
  onNumFramesChange: (value: number) => void;
  onResolutionChange: (value: string) => void;
  onAspectRatioChange: (value: string) => void;
  onFpsChange: (value: number) => void;
  onIterationsChange: (value: number) => void;
  onAudioChange: (value: boolean) => void;
  onLoopChange: (value: boolean) => void;
  onSeedLockedChange: (value: boolean) => void;
  durationRef: React.RefObject<HTMLElement>;
  resolutionRef: React.RefObject<HTMLDivElement>;
  showLoopControl: boolean;
  loopEnabled?: boolean;
};

export const WorkspaceControlsPanel = memo(function WorkspaceControlsPanel({
  engines,
  form,
  selectedEngine,
  capability,
  engineModeOptions,
  supportsAudioToggle,
  cfgScale,
  onCfgScaleChange,
  onEngineChange,
  onModeChange,
  onDurationChange,
  onNumFramesChange,
  onResolutionChange,
  onAspectRatioChange,
  onFpsChange,
  onIterationsChange,
  onAudioChange,
  onLoopChange,
  onSeedLockedChange,
  durationRef,
  resolutionRef,
  showLoopControl,
  loopEnabled,
}: WorkspaceControlsPanelProps) {
  return (
    <div className="contents xl:col-start-1 xl:row-start-1 xl:flex xl:min-w-0 xl:flex-col xl:gap-5 xl:self-start">
      <div className="order-1 xl:order-none">
        <div className="min-w-0">
          <EngineSelect
            engines={engines}
            engineId={form.engineId}
            onEngineChange={onEngineChange}
            mode={form.mode}
            onModeChange={onModeChange}
            modeOptions={engineModeOptions}
          />
        </div>
      </div>
      <div className="order-3 xl:order-none">
        <div className="min-w-0">
          <SettingsControls
            engine={selectedEngine}
            caps={capability}
            durationSec={form.durationSec}
            durationOption={form.durationOption ?? null}
            onDurationChange={onDurationChange}
            numFrames={form.numFrames ?? undefined}
            onNumFramesChange={onNumFramesChange}
            resolution={form.resolution}
            onResolutionChange={onResolutionChange}
            aspectRatio={form.aspectRatio}
            onAspectRatioChange={onAspectRatioChange}
            fps={form.fps}
            onFpsChange={onFpsChange}
            mode={form.mode}
            iterations={form.iterations}
            onIterationsChange={onIterationsChange}
            showAudioControl={supportsAudioToggle}
            audioEnabled={form.audio}
            onAudioChange={onAudioChange}
            showLoopControl={showLoopControl}
            loopEnabled={loopEnabled}
            onLoopChange={onLoopChange}
            showExtendControl={false}
            seedLocked={form.seedLocked}
            onSeedLockedChange={onSeedLockedChange}
            focusRefs={{
              duration: durationRef,
              resolution: resolutionRef,
            }}
            cfgScale={cfgScale}
            onCfgScaleChange={onCfgScaleChange}
          />
          {selectedEngine && (
            <div className="mt-3 space-y-1 rounded-input border border-border/80 bg-white/80 p-3 text-[12px] text-text-secondary">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-text-primary">{selectedEngine.label}</span>
                <span className="text-text-muted">• {MODE_DISPLAY_LABEL[form.mode]}</span>
              </div>
              {capability?.maxUploadMB && (form.mode === 'i2v' || form.mode === 'r2v') && (
                <p className="text-[11px] text-text-muted">Max upload: {capability.maxUploadMB} MB</p>
              )}
              {capability?.acceptsImageFormats && capability.acceptsImageFormats.length > 0 && form.mode === 'i2v' && (
                <p className="text-[11px] text-text-muted">
                  Accepted formats: {capability.acceptsImageFormats.map((format) => format.toUpperCase()).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
