'use client';

import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg text-text-secondary border border-border',
        primary: 'bg-accent text-white',
        secondary: 'bg-accentSoft/20 text-accent',
        success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-100 text-amber-700 border border-amber-200',
        error: 'bg-red-100 text-red-700 border border-red-200',
        info: 'bg-sky-100 text-sky-700 border border-sky-200',
        outline: 'border border-border text-text-secondary bg-transparent',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px] rounded',
        md: 'px-2 py-0.5 text-xs rounded-md',
        lg: 'px-2.5 py-1 text-sm rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
  dot?: boolean;
  dotColor?: string;
  icon?: ReactNode;
}

export function Badge({
  children,
  className,
  variant,
  size,
  dot,
  dotColor,
  icon,
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColor || 'bg-current opacity-70'
          )}
        />
      )}
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
}

// Status Badge - for job/engine status
export type StatusType = 'pending' | 'running' | 'completed' | 'failed' | 'live' | 'busy' | 'maintenance';

const statusConfig: Record<StatusType, { variant: BadgeProps['variant']; dotColor?: string }> = {
  pending: { variant: 'default', dotColor: 'bg-amber-500' },
  running: { variant: 'info', dotColor: 'bg-sky-500 animate-pulse' },
  completed: { variant: 'success', dotColor: 'bg-emerald-500' },
  failed: { variant: 'error', dotColor: 'bg-red-500' },
  live: { variant: 'success', dotColor: 'bg-emerald-500' },
  busy: { variant: 'warning', dotColor: 'bg-amber-500' },
  maintenance: { variant: 'default', dotColor: 'bg-gray-500' },
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusType;
  className?: string;
}) {
  const config = statusConfig[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant={config.variant}
      size="sm"
      dot
      dotColor={config.dotColor}
      className={className}
    >
      {label}
    </Badge>
  );
}

// Count Badge - for notification counts
export function CountBadge({
  count,
  max = 99,
  className,
}: {
  count: number;
  max?: number;
  className?: string;
}) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full',
        className
      )}
    >
      {displayCount}
    </span>
  );
}
