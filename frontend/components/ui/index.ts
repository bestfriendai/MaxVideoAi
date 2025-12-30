// UI Component Library - Barrel Export
// Import components from this file for cleaner imports:
// import { Button, Input, Modal } from '@/components/ui';

// Buttons
export { Button, buttonVariants } from './Button';

// Form Inputs
export { Input, inputVariants } from './Input';
export { TextArea, textareaVariants } from './TextArea';
export { Select, selectVariants, type SelectOption } from './Select';

// Layout
export { Card, CardHeader, CardContent, CardFooter } from './Card';

// Feedback
export { Modal, ConfirmDialog, type ModalProps, type ConfirmDialogProps } from './Modal';
export {
  toast,
  useToast,
  ToastContainer,
  toastStore,
  type Toast,
  type ToastType
} from './Toast';
export { Badge, StatusBadge, CountBadge, type StatusType } from './Badge';
export { Progress, CircularProgress, StepProgress } from './Progress';

// Loading & Empty States
export {
  Skeleton,
  SkeletonGroup,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonTable,
  SkeletonVideoCard,
  SkeletonJobCard,
} from './Skeleton';
export {
  EmptyState,
  NoResultsState,
  NoDataState,
  NoVideosState,
  ErrorState,
  OfflineState,
} from './EmptyState';

// Overlays & Tooltips
export { Tooltip, TooltipInfo } from './Tooltip';

// Media
export { Avatar, AvatarGroup } from './Avatar';

// Memoization utilities
export {
  withMemoization,
  MemoizedBlock,
  MemoizedListItem,
  MemoizedImage,
  VideoThumbnail,
  StatCard,
  EngineCard,
  useStableCallback,
  useDeepMemo,
} from './Memoized';

// Existing components
export { default as EngineIcon } from './EngineIcon';
export { default as UIIcon } from './UIIcon';
export { default as AudioEqualizerBadge } from './AudioEqualizerBadge';
