'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-border/40';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// Skeleton Group - for creating multiple skeletons
interface SkeletonGroupProps {
  count?: number;
  className?: string;
  gap?: number;
  children?: React.ReactNode;
}

export function SkeletonGroup({
  count = 3,
  className,
  gap = 8,
  children,
}: SkeletonGroupProps) {
  if (children) {
    return <div className={cn('flex flex-col', className)} style={{ gap }}>{children}</div>;
  }

  return (
    <div className={cn('flex flex-col', className)} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}

// Pre-built skeleton components for common use cases

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonButton({ width = 100 }: { width?: number }) {
  return <Skeleton variant="rounded" width={width} height={40} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border p-4 space-y-4">
      <Skeleton variant="rounded" height={180} />
      <div className="space-y-2">
        <Skeleton width="70%" height={20} />
        <Skeleton width="50%" height={16} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={16} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b border-border/50">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={14} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonVideoCard() {
  return (
    <div className="rounded-card border border-border overflow-hidden">
      <Skeleton variant="rectangular" className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton width="80%" height={18} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
  );
}

export function SkeletonJobCard() {
  return (
    <div className="rounded-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={32} />
        <div className="flex-1 space-y-1">
          <Skeleton width="60%" height={16} />
          <Skeleton width="30%" height={12} />
        </div>
        <Skeleton variant="rounded" width={60} height={24} />
      </div>
      <Skeleton variant="rounded" className="aspect-video w-full" />
      <div className="flex justify-between items-center">
        <Skeleton width={100} height={14} />
        <div className="flex gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </div>
    </div>
  );
}
