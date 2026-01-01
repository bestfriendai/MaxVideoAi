'use client';

import React, { memo } from 'react';
import { GalleryRail } from '@/components/GalleryRail';
import type { EngineCaps } from '@/types/engines';
import type { GroupSummary } from '@/types/groups';
import type { GroupedJobAction } from '@/components/GroupedJobCard';

export type WorkspaceGalleryRailProps = {
  variant: 'desktop' | 'mobile';
  engine: EngineCaps;
  activeGroups: GroupSummary[];
  onOpenGroup: (group: GroupSummary) => void;
  onGroupAction: (group: GroupSummary, action: GroupedJobAction) => void;
};

export const WorkspaceGalleryRail = memo(function WorkspaceGalleryRail({
  variant,
  engine,
  activeGroups,
  onOpenGroup,
  onGroupAction,
}: WorkspaceGalleryRailProps) {
  return (
    <GalleryRail
      engine={engine}
      activeGroups={activeGroups}
      onOpenGroup={onOpenGroup}
      onGroupAction={onGroupAction}
      variant={variant}
    />
  );
});
