'use client';

import React, { memo, useMemo, useCallback, ComponentType, ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Higher-order component for creating memoized versions of components
 * with custom comparison functions
 */
export function withMemoization<P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): ComponentType<P> {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name || 'Component'})`;
  return MemoizedComponent as unknown as ComponentType<P>;
}

/**
 * Memoized wrapper for expensive children
 * Use when a portion of your component tree is expensive to render
 */
interface MemoizedBlockProps {
  children: ReactNode;
  deps?: unknown[];
  className?: string;
}

export const MemoizedBlock = memo(function MemoizedBlock({
  children,
  deps = [],
  className,
}: MemoizedBlockProps) {
  const content = useMemo(() => children, [children, ...deps]);
  return className ? <div className={className}>{content}</div> : <>{content}</>;
});

/**
 * Memoized list item component
 * Useful for rendering items in large lists
 */
interface MemoizedListItemProps<T> extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => ReactNode;
  isSelected?: boolean;
}

function ListItemComponent<T>({
  item,
  index,
  renderItem,
  isSelected,
  className,
  ...rest
}: MemoizedListItemProps<T>) {
  return (
    <li
      className={cn(className, isSelected && 'selected')}
      data-selected={isSelected}
      {...rest}
    >
      {renderItem(item, index)}
    </li>
  );
}

export const MemoizedListItem = memo(ListItemComponent) as typeof ListItemComponent;

/**
 * Memoized image component with loading states
 */
interface MemoizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const MemoizedImage = memo(function MemoizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
}: MemoizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      onLoad={onLoad}
      onError={onError}
    />
  );
}, (prev, next) => {
  return prev.src === next.src &&
         prev.alt === next.alt &&
         prev.className === next.className &&
         prev.width === next.width &&
         prev.height === next.height;
});

/**
 * Memoized video thumbnail component
 */
interface VideoThumbnailProps {
  src: string;
  alt?: string;
  duration?: number;
  className?: string;
  aspectRatio?: string;
  onClick?: () => void;
}

export const VideoThumbnail = memo(function VideoThumbnail({
  src,
  alt = 'Video thumbnail',
  duration,
  className,
  aspectRatio = '16/9',
  onClick,
}: VideoThumbnailProps) {
  const formattedDuration = useMemo(() => {
    if (!duration) return null;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [duration]);

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-gray-800',
        className
      )}
      style={{ aspectRatio }}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />
      {formattedDuration && (
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          {formattedDuration}
        </span>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
        <div className="scale-0 transform rounded-full bg-white/90 p-3 transition-transform group-hover:scale-100">
          <svg className="h-4 w-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.src === next.src &&
         prev.duration === next.duration &&
         prev.className === next.className;
});

/**
 * Memoized stat card for dashboard/metrics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  className?: string;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  change,
  icon,
  className,
}: StatCardProps) {
  return (
    <div className={cn('rounded-xl bg-gray-800 p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-1 text-sm',
                change.type === 'increase' && 'text-green-400',
                change.type === 'decrease' && 'text-red-400',
                change.type === 'neutral' && 'text-gray-400'
              )}
            >
              {change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}
              {Math.abs(change.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-gray-700 p-2 text-gray-400">{icon}</div>
        )}
      </div>
    </div>
  );
});

/**
 * Memoized engine card for engine selection
 */
interface EngineCardProps {
  id: string;
  name: string;
  provider: string;
  version?: string;
  isSelected?: boolean;
  modes?: string[];
  avgDuration?: string;
  status?: string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const EngineCard = memo(function EngineCard({
  id,
  name,
  provider,
  version,
  isSelected,
  modes = [],
  avgDuration,
  status,
  icon,
  onClick,
  className,
}: EngineCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition',
        isSelected
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750',
        className
      )}
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{name}</p>
        <p className="text-sm text-gray-400">
          {provider}{version ? ` - ${version}` : ''}
        </p>
        {modes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {modes.map((mode) => (
              <span
                key={mode}
                className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
              >
                {mode}
              </span>
            ))}
          </div>
        )}
      </div>
      {(avgDuration || status) && (
        <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
          {avgDuration && <span>{avgDuration}</span>}
          {status && <span className="uppercase">{status}</span>}
        </div>
      )}
    </button>
  );
}, (prev, next) => {
  return prev.id === next.id &&
         prev.isSelected === next.isSelected &&
         prev.name === next.name;
});

/**
 * Hook for creating stable callbacks (alternative to useCallback with all deps)
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Hook for memoizing expensive computations with deep equality
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = React.useRef<{ deps: unknown[]; value: T } | null>(null);

  const depsEqual = ref.current
    ? deps.length === ref.current.deps.length &&
      deps.every((dep, i) => Object.is(dep, ref.current!.deps[i]))
    : false;

  if (!depsEqual) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current!.value;
}
