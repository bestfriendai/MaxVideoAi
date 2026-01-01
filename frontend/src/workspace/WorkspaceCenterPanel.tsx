'use client';

import React, { memo } from 'react';
import { CompositePreviewDock } from '@/components/groups/CompositePreviewDock';
import { GroupedJobCard, type GroupedJobAction } from '@/components/GroupedJobCard';
import { Composer, type ComposerAttachment, type AssetFieldConfig } from '@/components/Composer';
import type { EngineCaps, PreflightResponse } from '@/types/engines';
import type { GroupSummary } from '@/types/groups';
import type { VideoGroup } from '@/types/video-groups';

export type WorkspaceCenterPanelProps = {
  showCenterGallery: boolean;
  emptyGalleryCopy: string;
  normalizedPendingGroups: GroupSummary[];
  isGenerationLoading: boolean;
  generationSkeletonCount: number;
  engineMap: Map<string, EngineCaps>;
  onActiveGroupOpen: (group: GroupSummary) => void;
  onActiveGroupAction: (group: GroupSummary, action: GroupedJobAction) => void;
  compositeGroup: VideoGroup | null;
  isCompositeLoading: boolean;
  sharedPrompt: string | null;
  onCopyPrompt?: () => void;
  onOpenComposite: (group: VideoGroup | null) => void;
  engine: EngineCaps;
  prompt: string;
  negativePrompt: string;
  price: number | null;
  currency: string;
  isPricing: boolean;
  error?: string;
  messages?: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  onGenerate: () => void;
  iterations: number;
  preflight: PreflightResponse | null;
  promptField?: AssetFieldConfig['field'];
  promptRequired: boolean;
  negativePromptField?: AssetFieldConfig['field'];
  negativePromptRequired?: boolean;
  assetFields: AssetFieldConfig[];
  assets: Record<string, (ComposerAttachment | null)[]>;
  onAssetAdd: (field: AssetFieldConfig['field'], file: File, slotIndex?: number) => void;
  onAssetRemove: (field: AssetFieldConfig['field'], index: number) => void;
  onNotice: (message: string) => void;
  onOpenLibrary: (field: AssetFieldConfig['field'], slotIndex: number) => void;
};

export const WorkspaceCenterPanel = memo(function WorkspaceCenterPanel({
  showCenterGallery,
  emptyGalleryCopy,
  normalizedPendingGroups,
  isGenerationLoading,
  generationSkeletonCount,
  engineMap,
  onActiveGroupOpen,
  onActiveGroupAction,
  compositeGroup,
  isCompositeLoading,
  sharedPrompt,
  onCopyPrompt,
  onOpenComposite,
  engine,
  prompt,
  negativePrompt,
  price,
  currency,
  isPricing,
  error,
  messages,
  textareaRef,
  onPromptChange,
  onNegativePromptChange,
  onGenerate,
  iterations,
  preflight,
  promptField,
  promptRequired,
  negativePromptField,
  negativePromptRequired,
  assetFields,
  assets,
  onAssetAdd,
  onAssetRemove,
  onNotice,
  onOpenLibrary,
}: WorkspaceCenterPanelProps) {
  return (
    <div className="order-2 xl:order-none xl:col-start-2 xl:row-start-1 xl:self-start">
      <div className="space-y-5">
        {showCenterGallery ? (
          normalizedPendingGroups.length === 0 && !isGenerationLoading ? (
            <div className="rounded-card border border-border bg-white/80 p-5 text-center text-sm text-text-secondary">
              {emptyGalleryCopy}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {normalizedPendingGroups.map((group) => {
                const engineId = group.hero.engineId;
                const engineForGroup = engineId ? engineMap.get(engineId) ?? null : null;
                return (
                  <GroupedJobCard
                    key={group.id}
                    group={group}
                    engine={engineForGroup ?? undefined}
                    onOpen={onActiveGroupOpen}
                    onAction={onActiveGroupAction}
                    allowRemove={false}
                  />
                );
              })}
              {isGenerationLoading &&
                Array.from({ length: normalizedPendingGroups.length ? 0 : generationSkeletonCount }).map((_, index) => (
                  <div key={`workspace-gallery-skeleton-${index}`} className="rounded-card border border-border bg-white/60 p-0" aria-hidden>
                    <div className="relative overflow-hidden rounded-card">
                      <div className="relative" style={{ aspectRatio: '16 / 9' }}>
                        <div className="skeleton absolute inset-0" />
                      </div>
                    </div>
                    <div className="border-t border-border bg-white/70 px-3 py-2">
                      <div className="h-3 w-24 rounded-full bg-neutral-200" />
                    </div>
                  </div>
                ))}
            </div>
          )
        ) : null}
        <CompositePreviewDock
          group={compositeGroup}
          isLoading={isCompositeLoading}
          copyPrompt={sharedPrompt}
          onCopyPrompt={sharedPrompt ? onCopyPrompt : undefined}
          onOpenModal={onOpenComposite}
        />
        <Composer
          engine={engine}
          prompt={prompt}
          onPromptChange={onPromptChange}
          negativePrompt={negativePrompt}
          onNegativePromptChange={onNegativePromptChange}
          price={price}
          currency={currency}
          isLoading={isPricing}
          error={error}
          messages={messages}
          textareaRef={textareaRef}
          onGenerate={onGenerate}
          iterations={iterations}
          preflight={preflight}
          promptField={promptField}
          promptRequired={promptRequired}
          negativePromptField={negativePromptField}
          negativePromptRequired={negativePromptRequired}
          assetFields={assetFields}
          assets={assets}
          onAssetAdd={onAssetAdd}
          onAssetRemove={onAssetRemove}
          onNotice={onNotice}
          onOpenLibrary={onOpenLibrary}
        />
      </div>
    </div>
  );
});
