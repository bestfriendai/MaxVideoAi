'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-surface border border-border',
      bordered: 'bg-transparent border-2 border-border',
      elevated: 'bg-surface shadow-card',
      ghost: 'bg-transparent',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-card',
          variantClasses[variant],
          paddingClasses[padding],
          hover && 'transition-all duration-200 hover:shadow-float hover:border-accent/30',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    if (children) {
      return (
        <div
          ref={ref}
          className={cn('mb-4', className)}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 mt-4 pt-4 border-t border-hairline', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
