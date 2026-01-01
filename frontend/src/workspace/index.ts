// Workspace module barrel exports

// Context and state management
export {
  WorkspaceProvider,
  useWorkspace,
  useWorkspaceOptional,
  type WorkspaceState,
  type WorkspaceAction,
  type WorkspaceContextValue,
  type WorkspaceProviderProps,
} from './WorkspaceProvider';

// Types
export type { WorkspaceFormState } from './types';

// Hooks
export { useWorkspacePricing, type WorkspacePricingOptions } from './useWorkspacePricing';
export { useWorkspaceStorage, type WorkspaceStorage } from './useWorkspaceStorage';
export { useWorkspacePersistence, type WorkspacePersistenceState, type UseWorkspacePersistenceOptions } from './useWorkspacePersistence';
export { useJobStream, type JobStreamPayload, type JobStreamOptions } from './useJobStream';

// Panels and components
export { EnginePanel, type EnginePanelProps } from './EnginePanel';
export { WorkspaceControlsPanel, type WorkspaceControlsPanelProps } from './WorkspaceControlsPanel';
export { WorkspaceCenterPanel, type WorkspaceCenterPanelProps } from './WorkspaceCenterPanel';
export { WorkspaceGalleryRail, type WorkspaceGalleryRailProps } from './WorkspaceGalleryRail';
export { WorkspaceCompareDrawer, type WorkspaceCompareDrawerProps } from './WorkspaceCompareDrawer';
export { WorkspaceTopUpModal, type WorkspaceTopUpModalProps, type WorkspaceTopUpModalState, type WorkspaceTopUpCopy } from './WorkspaceTopUpModal';

// Compare workflow
export {
  compareReducer,
  createInitialCompareState,
  type CompareEntry,
  type CompareState,
  type CompareAction,
} from './compare/types';
