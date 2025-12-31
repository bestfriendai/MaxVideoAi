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

// Navigation
export { Drawer, MobileNavDrawer, BottomSheet } from './Drawer';
export {
  BottomNav,
  FloatingActionButton,
  MobileHeader,
  TabBar,
} from './BottomNav';
export {
  Breadcrumb,
  PageHeader,
  SectionHeader,
  type BreadcrumbItem,
} from './Breadcrumb';

// Command Palette
export {
  CommandPaletteProvider,
  useCommandPalette,
  KeyboardShortcutsModal,
  type CommandItem,
  type CommandGroup,
} from './CommandPalette';

// Data Table
export {
  DataTable,
  StatusCell,
  RowActions,
  RowActionItem,
  type Column,
  type SortState,
  type SortDirection,
  type FilterState,
  type PaginationState,
} from './DataTable';

// Page Transitions & Loading
export {
  PageTransition,
  StaggeredList,
  LoadingBarProvider,
  useLoadingBar,
  PageLoader,
  Spinner,
  SuspenseFallback,
  Reveal,
  FadeInWhenVisible,
  Pulse,
  SkeletonPage,
  SkeletonDashboard,
} from './PageTransition';

// Existing components
export { EngineIcon } from './EngineIcon';
export { UIIcon } from './UIIcon';
export { AudioEqualizerBadge } from './AudioEqualizerBadge';
