'use client';

import React, { memo } from 'react';
import { EngineSelect } from '@/components/ui/EngineSelect';
import type { EngineCaps, Mode } from '@/types/engines';

export type EnginePanelProps = {
  engines: EngineCaps[];
  engineId: string;
  mode: Mode;
  modeOptions?: Mode[];
  onEngineChange: (engineId: string) => void;
  onModeChange: (mode: Mode) => void;
  showBillingNote?: boolean;
};

export const EnginePanel = memo(function EnginePanel({
  engines,
  engineId,
  mode,
  modeOptions,
  onEngineChange,
  onModeChange,
  showBillingNote = true,
}: EnginePanelProps) {
  return (
    <EngineSelect
      engines={engines}
      engineId={engineId}
      mode={mode}
      modeOptions={modeOptions}
      onEngineChange={onEngineChange}
      onModeChange={onModeChange}
      showBillingNote={showBillingNote}
    />
  );
});
