'use client';

import { type ReactNode } from 'react';
import { type LucideIcon, Inbox, Search, FileX, AlertCircle, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    iconWrapper: 'w-12 h-12',
    icon: 'w-6 h-6',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    iconWrapper: 'w-16 h-16',
    icon: 'w-8 h-8',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    iconWrapper: 'w-20 h-20',
    icon: 'w-10 h-10',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  icon: IconProp,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  const renderIcon = () => {
    if (!IconProp) {
      return <Inbox className={cn(sizes.icon, 'text-text-muted')} />;
    }

    if (typeof IconProp === 'function') {
      const Icon = IconProp as LucideIcon;
      return <Icon className={cn(sizes.icon, 'text-text-muted')} />;
    }

    return IconProp;
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizes.container,
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-bg flex items-center justify-center mb-4',
          sizes.iconWrapper
        )}
      >
        {renderIcon()}
      </div>
      <h3 className={cn('font-semibold text-text-primary mb-2', sizes.title)}>
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-text-secondary max-w-sm mb-6',
            sizes.description
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-built empty states for common use cases

export function NoResultsState({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search.`
          : 'Try adjusting your filters or search query.'
      }
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

export function NoDataState({
  title = 'No data yet',
  description = "There's nothing here yet. Data will appear once it's available.",
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function NoVideosState({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <EmptyState
      icon={FileX}
      title="No videos yet"
      description="Create your first AI-generated video to get started."
      action={
        onGenerate
          ? { label: 'Generate Video', onClick: onGenerate }
          : undefined
      }
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = "We encountered an error. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={Wifi}
      title="You're offline"
      description="Please check your internet connection and try again."
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}
